import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type { NutritionTargets, RecommendedMeal, UserProfile } from './src/types.ts';

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('GEMINI_API_KEY')) {
    return {
      status: 500,
      message: 'Gemini API key is missing. Please configure GEMINI_API_KEY in Settings > Secrets.',
    };
  }
  if (raw.includes('403') || raw.includes('PERMISSION_DENIED') || raw.includes('API_KEY_INVALID')) {
    return {
      status: 403,
      message: 'API key permission error. Please check your GEMINI_API_KEY in Settings > Secrets.',
    };
  }
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message: 'AI recommendation quota temporarily reached. Please wait a moment and try again.',
    };
  }
  return {
    status: 500,
    message: raw || 'Failed to generate personalized nutrition recommendation.',
  };
}

const mealObjectSchema = {
  type: Type.OBJECT,
  properties: {
    slot: {
      type: Type.STRING,
      description: 'Must be one of: breakfast, lunch, snack, dinner',
    },
    title: {
      type: Type.STRING,
      description: 'Appetizing, practical, real-world meal title',
    },
    subtitle: {
      type: Type.STRING,
      description: 'Concise 1-line sensory/nutritional subtitle under 70 characters',
    },
    prepMinutes: { type: Type.INTEGER },
    calories: { type: Type.INTEGER },
    proteinG: { type: Type.INTEGER },
    carbsG: { type: Type.INTEGER },
    fatG: { type: Type.INTEGER },
    fiberG: { type: Type.INTEGER },
    portionGuide: {
      type: Type.STRING,
      description: 'Clear practical portion summary with gram/household amounts separated by middots',
    },
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          item: { type: Type.STRING },
          amount: { type: Type.STRING },
        },
        required: ['item', 'amount'],
      },
    },
    prepSteps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '2 to 3 crisp, actionable preparation steps',
    },
    scientificRationale: {
      type: Type.STRING,
      description: '1 to 2 sentences explaining the nutritional/metabolic reason this meal matches the user profile and body goal',
    },
    keyMicronutrients: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '2 to 3 notable vitamins, minerals, or bioactive compounds',
    },
  },
  required: [
    'slot',
    'title',
    'subtitle',
    'prepMinutes',
    'calories',
    'proteinG',
    'carbsG',
    'fatG',
    'fiberG',
    'portionGuide',
    'ingredients',
    'prepSteps',
    'scientificRationale',
    'keyMicronutrients',
  ],
};

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/recommendations', async (req, res) => {
    try {
      const { profile, targets, focusNote } = req.body as {
        profile: UserProfile;
        targets: NutritionTargets;
        focusNote?: string;
      };

      if (!profile || !targets) {
        res.status(400).json({ error: 'Missing profile or targets payload.' });
        return;
      }

      const ai = getGeminiClient();

      const prompt = `
Design a personalized 1-day meal plan (exactly 4 slots in order: breakfast, lunch, snack, dinner) for this individual:

BIOMETRIC & BODY GOAL PROFILE:
- Age: ${profile.age} years, Sex: ${profile.sex}
- Height: ${profile.heightCm} cm, Current Weight: ${profile.weightKg} kg, Target Weight: ${profile.targetWeightKg} kg
- BMI: ${targets.bmi} (${targets.bmiCategory})
- Body Goal: ${profile.bodyGoal}
- Activity Level: ${profile.activityLevel}
- Dietary Preference: ${profile.dietaryPreference}
- Health Considerations & Restrictions (STRICTLY RESPECT ALLERGIES/EXCLUSIONS): ${
        profile.healthConsiderations.length > 0 ? profile.healthConsiderations.join(', ') : 'None specified'
      }
${focusNote ? `- Today's Specific Request: ${focusNote}` : ''}

SCIENTIFIC DAILY TARGETS:
- Total Calories: ${targets.dailyCalories} kcal (within +/- 5% across the 4 meals)
- Protein: ${targets.macros.proteinG} g
- Carbohydrates: ${targets.macros.carbsG} g
- Fat: ${targets.macros.fatG} g
- Fiber: ${targets.macros.fiberG} g+
- Hydration: ${targets.macros.waterLiters} L

REQUIREMENTS:
1. Meals must be practical, delicious, accessible grocery-store ingredients, culturally varied, and realistic to prepare at home.
2. Tailor portion density to the body goal:
   - If weight_loss / overweight / obese: emphasize high-volume, high-protein, high-fiber satiety meals with controlled energy density.
   - If healthy_gain / underweight: emphasize nutrient-dense, easy-to-digest healthy fats, quality proteins, and complex carbs without excessive bulk.
   - If maintain / recomp: emphasize balanced macro distribution, colorful micronutrients, and steady blood glucose.
3. Strictly obey dietaryPreference (${profile.dietaryPreference}) and every item in healthConsiderations.
4. Keep slot values strictly lowercase: "breakfast", "lunch", "snack", "dinner".
`.trim();

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a clinical registered dietitian and nutritional biochemist creating precise, evidence-based, practical daily meal recommendations.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              planSummary: {
                type: Type.STRING,
                description: '2-sentence clinical overview connecting today menu to their body goal and health needs',
              },
              hydrationTip: {
                type: Type.STRING,
                description: '1 practical hydration timing recommendation',
              },
              meals: {
                type: Type.ARRAY,
                items: mealObjectSchema,
              },
            },
            required: ['planSummary', 'hydrationTip', 'meals'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim()) as {
        planSummary: string;
        hydrationTip: string;
        meals: Array<Omit<RecommendedMeal, 'id'>>;
      };

      const normalizedMeals: RecommendedMeal[] = (parsed.meals ?? []).map((meal, index) => ({
        ...meal,
        id: `ai-${meal.slot}-${Date.now()}-${index}`,
      }));

      res.json({
        generatedAt: new Date().toISOString(),
        planSummary: parsed.planSummary,
        hydrationTip: parsed.hydrationTip,
        meals: normalizedMeals,
      });
    } catch (err) {
      const { status, message } = formatGeminiError(err);
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/meal-swap', async (req, res) => {
    try {
      const { profile, targets, currentMeal, swapReason } = req.body as {
        profile: UserProfile;
        targets: NutritionTargets;
        currentMeal: RecommendedMeal;
        swapReason: string;
      };

      if (!profile || !targets || !currentMeal) {
        res.status(400).json({ error: 'Missing meal swap parameters.' });
        return;
      }

      const ai = getGeminiClient();

      const prompt = `
Generate ONE fresh replacement meal for the "${currentMeal.slot}" slot to replace "${currentMeal.title}".

USER CONSTRAINTS:
- Dietary Preference: ${profile.dietaryPreference}
- Body Goal: ${profile.bodyGoal} (BMI ${targets.bmi}, ${targets.bmiCategory})
- Health Considerations & Restrictions (STRICTLY OBEY): ${
        profile.healthConsiderations.length > 0 ? profile.healthConsiderations.join(', ') : 'None'
      }
- Swap Preference / Reason: ${swapReason || 'Provide a fresh, equally nutritious alternative'}

NUTRITIONAL BUDGET TO MATCH CLOSELY:
- Target Calories: ~${currentMeal.calories} kcal (within +/- 50 kcal)
- Target Protein: ~${currentMeal.proteinG} g
- Target Carbs: ~${currentMeal.carbsG} g
- Target Fat: ~${currentMeal.fatG} g

Ensure slot is "${currentMeal.slot}" and the meal feels distinct from "${currentMeal.title}".
`.trim();

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a clinical dietitian generating an equivalent nutritional meal swap tailored to user preferences and medical/dietary needs.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: mealObjectSchema,
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim()) as Omit<RecommendedMeal, 'id'>;
      res.json({
        ...parsed,
        slot: currentMeal.slot,
        id: `ai-swap-${currentMeal.slot}-${Date.now()}`,
      });
    } catch (err) {
      const { status, message } = formatGeminiError(err);
      res.status(status).json({ error: message });
    }
  });

  app.post('/api/food-check', async (req, res) => {
    try {
      const { profile, targets, foodDescription } = req.body as {
        profile: UserProfile;
        targets: NutritionTargets;
        foodDescription: string;
      };

      if (!foodDescription?.trim() || !profile || !targets) {
        res.status(400).json({ error: 'Please describe a meal or food item to analyze.' });
        return;
      }

      const ai = getGeminiClient();

      const prompt = `
Estimate the nutrition and goal compatibility for this food/meal description:
"${foodDescription.trim()}"

User context:
- Body Goal: ${profile.bodyGoal} (BMI ${targets.bmi}, ${targets.bmiCategory})
- Daily Target: ${targets.dailyCalories} kcal, ${targets.macros.proteinG}g protein
- Dietary Preference: ${profile.dietaryPreference}
- Health Considerations: ${profile.healthConsiderations.join(', ') || 'None'}

Provide realistic nutrition estimates and a brief practical optimization tip (e.g. pairing with fiber or adjusting portion) tailored to their goal.
`.trim();

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a registered dietitian providing accurate, realistic food nutrition estimates and supportive goal-fit guidance.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              portion: { type: Type.STRING },
              calories: { type: Type.INTEGER },
              proteinG: { type: Type.INTEGER },
              carbsG: { type: Type.INTEGER },
              fatG: { type: Type.INTEGER },
              fiberG: { type: Type.INTEGER },
              goalFitNote: {
                type: Type.STRING,
                description: '1 concise sentence assessing fit with their body goal and suggesting a practical pairing if helpful',
              },
            },
            required: ['title', 'portion', 'calories', 'proteinG', 'carbsG', 'fatG', 'fiberG', 'goalFitNote'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (err) {
      const { status, message } = formatGeminiError(err);
      res.status(status).json({ error: message });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VitalPlate server listening on http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
