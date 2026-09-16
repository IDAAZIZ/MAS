import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: 'navy' | 'gold' | 'green' | 'red' | 'purple' | 'orange';
  className?: string;
}

const colorMap = {
  navy: 'bg-navy/10 text-navy',
  gold: 'bg-gold/10 text-gold',
  green: 'bg-green-100 text-green-600',
  red: 'bg-red-100 text-red-600',
  purple: 'bg-purple-100 text-purple-600',
  orange: 'bg-orange-100 text-orange-600',
};

const iconBgMap = {
  navy: 'bg-navy/10',
  gold: 'bg-gold/10',
  green: 'bg-green-50',
  red: 'bg-red-50',
  purple: 'bg-purple-50',
  orange: 'bg-orange-50',
};

export default function StatCard({ title, value, icon: Icon, trend, color = 'navy', className = '' }: StatCardProps) {
  return (
    <div className={`card ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500 mt-1 font-medium">{title}</p>
          {trend && (
            <p className={`text-xs mt-2 font-medium ${colorMap[color]}`}>{trend}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconBgMap[color]}`}>
          <Icon className={`w-6 h-6 ${colorMap[color].split(' ')[1]}`} />
        </div>
      </div>
    </div>
  );
}
