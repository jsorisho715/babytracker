import { useStore } from '../store/useStore';
import { CheckCircle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast, uncompleteTask, unpurchaseItem } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-0 right-0 z-50 flex flex-col gap-2 items-center px-4 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-3 bg-gray-900 text-white rounded-2xl px-4 py-3 shadow-lg max-w-sm w-full animate-slide-up"
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-sage-300 flex-shrink-0" />
          ) : (
            <Info className="w-5 h-5 text-rose-baby flex-shrink-0" />
          )}
          <span className="flex-1 text-sm font-display font-600">{toast.message}</span>
          {toast.canUndo && toast.taskId && (
            <button
              onClick={() => {
                if (toast.taskId) {
                  uncompleteTask(toast.taskId);
                  unpurchaseItem(toast.taskId);
                }
                removeToast(toast.id);
              }}
              className="text-xs text-sage-300 font-display font-700 underline underline-offset-2 flex-shrink-0"
            >
              Undo
            </button>
          )}
          <button onClick={() => removeToast(toast.id)} className="flex-shrink-0">
            <X className="w-4 h-4 opacity-60" />
          </button>
        </div>
      ))}
    </div>
  );
}
