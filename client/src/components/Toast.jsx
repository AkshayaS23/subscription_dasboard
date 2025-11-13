// client/src/components/Toast.jsx
import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose, duration = 4000, darkMode = false }) {
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast, duration, onClose]);

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    if (darkMode) {
      return 'bg-gray-800 border border-gray-700';
    }
    return 'bg-white border border-gray-200';
  };

  const getTextColor = () => {
    return darkMode ? 'text-gray-100' : 'text-gray-900';
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className={`${getBgColor()} rounded-lg shadow-lg p-4 flex items-start gap-3 max-w-md`}>
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1">
          <p className={`${getTextColor()} text-sm font-medium`}>
            {toast.message}
          </p>
        </div>
        <button
          onClick={onClose}
          className={`flex-shrink-0 ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}