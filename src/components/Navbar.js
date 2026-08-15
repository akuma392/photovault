import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { authService } from "../services/backend";
import { Moon, Sun, Upload, LogOut, User, Shield, Image as ImageIcon } from "lucide-react";

export const Navbar = () => {
    const { user, setUser, theme, toggleTheme } = useApp();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await authService.logout();
        setUser(null);
        navigate("/login");
    };

    return (
        <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-800/80 backdrop-blur border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-indigo-600 dark:text-indigo-400">
                <ImageIcon /> PhotoVault
            </Link>

            <div className="flex items-center gap-3">
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                    aria-label="Toggle Theme"
                >
                    {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {user ? (
                    <>
                        {user.isAdmin && (
                            <Link
                                to="/admin"
                                className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition"
                            >
                                <Shield size={16} /> Admin
                            </Link>
                        )}

                        <Link
                            to="/upload"
                            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition"
                        >
                            <Upload size={16} /> Upload
                        </Link>

                        <Link
                            to="/profile"
                            className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 hover:text-indigo-500"
                        >
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center">
                                    <User size={16} />
                                </div>
                            )}
                            <span className="hidden sm:inline font-medium">{user.name}</span>
                        </Link>

                        <button
                            onClick={handleLogout}
                            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full transition"
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </>
                ) : (
                    <div className="flex gap-2">
                        <Link
                            to="/login"
                            className="text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                            Login
                        </Link>
                        <Link
                            to="/signup"
                            className="text-sm font-medium bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition"
                        >
                            Sign Up
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
};