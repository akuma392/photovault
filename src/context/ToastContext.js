// src/context/ToastContext.jsx
import React, { createContext, useContext, useState, useCallback } from "react";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = "error") => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto dismiss after 4 seconds
        setTimeout(() => {
            removeToast(id);
        }, 4000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast: addToast, removeToast }}>
            {children}
            {/* Toast Render Container */}
            <aside aria-label="Notifications" className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        role="status"
                        className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 ${toast.type === "success"
                                ? "bg-emerald-50/95 border-emerald-200 text-emerald-900 dark:bg-emerald-950/90 dark:border-emerald-800 dark:text-emerald-200"
                                : toast.type === "info"
                                    ? "bg-sky-50/95 border-sky-200 text-sky-900 dark:bg-sky-950/90 dark:border-sky-800 dark:text-sky-200"
                                    : "bg-rose-50/95 border-rose-200 text-rose-900 dark:bg-rose-950/90 dark:border-rose-800 dark:text-rose-200"
                            }`}
                    >
                        <div className="mt-0.5 shrink-0">
                            {toast.type === "success" && <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400" />}
                            {toast.type === "info" && <Info size={18} className="text-sky-600 dark:text-sky-400" />}
                            {toast.type === "error" && <AlertCircle size={18} className="text-rose-600 dark:text-rose-400" />}
                        </div>
                        <div className="flex-1 text-sm font-medium leading-relaxed break-words">
                            {toast.message}
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition"
                            aria-label="Close"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </aside>
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);