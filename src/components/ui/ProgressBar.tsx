interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
  color?: 'navy' | 'gold' | 'green';
}

const colorClasses = {
  navy: 'bg-navy',
  gold: 'bg-gold',
  green: 'bg-green-500',
};

export default function ProgressBar({ value, max, label, showPercentage = true, className = '', color = 'navy' }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;

  return (
    <div className={className}>
      {(label || showPercentage) && (
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          {label && <span>{label}</span>}
          {showPercentage && <span>{pct}%</span>}
        </div>
      )}
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClasses[color]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
