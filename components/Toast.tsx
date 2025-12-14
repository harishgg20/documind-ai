import React from 'react';
import { X, CheckCircle, AlertCircle, Info, Mail } from 'lucide-react';
import { useToast, Toast as ToastType } from '../contexts/ToastContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto w-80 bg-white rounded-xl shadow-google-hover border border-[#e1e3e1] overflow-hidden animate-in slide-in-from-right duration-300 fade-in"
        >
          <div className="p-4 flex gap-3">
            <div className="flex-shrink-0 pt-0.5">
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-google-green" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-google-red" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-google-blue" />}
              {toast.type === 'email' && <div className="p-1.5 bg-[#e8f0fe] rounded-full"><Mail className="w-4 h-4 text-google-blue" /></div>}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-[#1f1f1f]">{toast.title}</h4>
              <p className="text-xs text-[#444746] mt-1 leading-relaxed">{toast.message}</p>
            </div>
            <button 
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-[#444746] hover:text-[#1f1f1f] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Progress Bar for Email Simulation */}
          {toast.type === 'email' && (
              <div className="h-1 w-full bg-[#f0f4f9]">
                  <div className="h-full bg-google-blue animate-[progress_5s_linear_forward]" style={{ width: '100%' }}></div>
              </div>
          )}
        </div>
      ))}
    </div>
  );
};