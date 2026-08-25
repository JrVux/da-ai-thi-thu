import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => {
        const bg = {
          success: 'bg-emerald-50 border-emerald-300 text-emerald-900',
          warning: 'bg-amber-50 border-amber-300 text-amber-900',
          error: 'bg-rose-50 border-rose-300 text-rose-900',
          info: 'bg-sky-50 border-sky-300 text-sky-900',
        }[toast.type];

        const Icon = {
          success: CheckCircle2,
          warning: AlertTriangle,
          error: XCircle,
          info: Info,
        }[toast.type];

        const iconColor = {
          success: 'text-emerald-600',
          warning: 'text-amber-600',
          error: 'text-rose-600',
          info: 'text-sky-600',
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto border rounded-xl p-4 shadow-lg flex items-start gap-3 transition-all duration-300 animate-slide-up ${bg}`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 text-sm">
              <div className="font-semibold">{toast.title}</div>
              {toast.message && <div className="mt-0.5 text-xs opacity-90">{toast.message}</div>}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-gray-400 hover:text-gray-700 transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
