import { X, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PromptGuardDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  details?: string[];
}

export default function PromptGuardDialog({ open, onClose, title = '安全提示', message, details }: PromptGuardDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 animate-in zoom-in-95 duration-200 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110 hover:rotate-90"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="text-gray-700 text-sm whitespace-pre-line">
          {message}
        </div>
        {details && details.length > 0 && (
          <ul className="mt-3 list-disc list-inside text-xs text-gray-600 space-y-1">
            {details.slice(0, 5).map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        )}
        <div className="mt-5 flex justify-end">
          <Button onClick={onClose} variant="outline" className="hover:scale-105 transition-all">
            我已知晓
          </Button>
        </div>
      </div>
    </div>
  );
}


