import { LucideIcon } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
  title: string;
  message: string;
  icon: LucideIcon;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ title, message, icon: Icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 text-center max-w-sm mb-6">{message}</p>
      {action && (
        <Button variant="primary" onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}
