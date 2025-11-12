import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Props:
 * - toast: { id?, message, type }  // type: 'info' | 'success' | 'warning' | 'error'
 * - onClose(toastId)
 * - duration (ms) default 4000
 * - darkMode (bool)
 */
export default function Toast({ toast, onClose, duration = 4000, darkMode }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => onClose(toast?.id), duration);
    return () => clearTimeout(t);
  }, [toast, duration, onClose]);

  if (!toast) return null;

  const bg = darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900';
  const border = toast.type === 'error' ? 'border-red-400' : toast.type === 'success' ? 'border-green-400' : 'border-yellow-400';
  const accent = toast.type === 'error' ? 'text-red-600' : toast.type === 'success' ? 'text-green-600' : 'text-yellow-700';

  return (
    <div
      className={`fixed right-6 bottom-6 z-50 w-96 max-w-full shadow-lg rounded-lg border ${border} ${bg} overflow-hidden`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start space-x-3 p-4">
        <div className={`pt-0.5 ${accent} font-semibold`}>{toast.type?.toUpperCase()}</div>
        <div className="flex-1 text-sm">
          <div className="font-medium">{toast.message}</div>
        </div>
        <button
          onClick={() => onClose(toast.id)}
          className="ml-2 p-1 rounded hover:bg-gray-200/30 focus:outline-none"
          aria-label="Close"
        >
          <X className={`${darkMode ? 'text-gray-200' : 'text-gray-700'} w-4 h-4`} />
        </button>
      </div>
    </div>
  );
}
