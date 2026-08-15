import React from "react";
import { Image as ImageIcon } from "lucide-react";

export const Footer = () => {
    return (
        <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-6 px-4 mt-auto">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200 text-sm">
                    <ImageIcon size={18} className="text-indigo-600" /> PhotoVault
                </div>
                <p>© {new Date().getFullYear()} PhotoVault Inc. Secure media cloud storage.</p>
                <div className="flex gap-4">
                    <span className="hover:underline cursor-pointer">Privacy Policy</span>
                    <span className="hover:underline cursor-pointer">Terms of Service</span>
                    <span className="hover:underline cursor-pointer">Support</span>
                </div>
            </div>
        </footer>
    );
};