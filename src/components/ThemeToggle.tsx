"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-xl transition-all hover:scale-105 active:scale-95 group text-sm font-medium"
        >
            <div className="relative w-5 h-5 overflow-hidden">
                <div className={`absolute inset-0 transition-transform duration-500 ${theme === 'dark' ? '-translate-y-full' : 'translate-y-0'}`}>
                    {/* Sun Icon for Light Mode */}
                    <span className="text-amber-400 text-lg">☀</span>
                </div>
                <div className={`absolute inset-0 transition-transform duration-500 ${theme === 'dark' ? 'translate-y-0' : 'translate-y-full'}`}>
                    {/* Moon Icon for Dark Mode */}
                    <span className="text-purple-400 text-lg">☾</span>
                </div>
            </div>
            <span className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </span>
        </button>
    );
}
