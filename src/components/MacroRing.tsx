import React from 'react';

interface MacroRingProps {
  value: number;
  target: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label: string;
  unit?: string;
}

export const MacroRing: React.FC<MacroRingProps> = ({
  value,
  target,
  size = 128,
  strokeWidth = 10,
  color = '#F5B800',
  trackColor = '#1E355E',
  label,
  unit = 'kcal',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = target > 0 ? Math.min(1, Math.max(0, value / target)) : 0;
  const strokeDashoffset = circumference * (1 - ratio);
  const remaining = Math.max(0, target - value);

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-300 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
        <span className="font-mono text-xl font-semibold tracking-tight text-[#F8FAFC] tabular-nums">
          {remaining.toLocaleString()}
        </span>
        <span className="text-[11px] font-medium text-[#A5B6D4] leading-tight mt-0.5">
          {unit} left
        </span>
        <span className="sr-only">
          {label}: {value} of {target} {unit}
        </span>
      </div>
    </div>
  );
};
