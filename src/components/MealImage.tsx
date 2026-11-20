import React, { useState } from 'react';
import { Utensils } from 'lucide-react';
import type { MealSlot } from '../types';
import { MEAL_SLOT_IMAGES } from '../lib/mealImages';

interface MealImageProps {
  slot: MealSlot;
  alt: string;
  className?: string;
}

export const MealImage: React.FC<MealImageProps> = ({ slot, alt, className = '' }) => {
  const [failed, setFailed] = useState(false);
  const src = MEAL_SLOT_IMAGES[slot];

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#13264A] to-[#0C1933] text-[#FCD34D] ${className}`}
        role="img"
        aria-label={alt}
      >
        <Utensils className="w-7 h-7 opacity-85 mb-1.5" />
        <span className="text-xs font-medium text-[#E2E9F5] px-3 text-center line-clamp-1">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
};
