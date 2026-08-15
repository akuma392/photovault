// src/pages/AuthPages.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../services/backend";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import { Mail, Lock, User, KeyRound, Sparkles, UserX, ArrowRight } from "lucide-react";

// Google Button (Used on Login page)
const GoogleButton = () => {
    const { showToast } = useToast();
    return (
        <button
            type="button"
            onClick={() => {
                try {
                    authService.loginWithGoogle();
                } catch {
                    showToast("Failed to launch Google Login", "error");
                }
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-lg font-medium text-xs hover:bg-slate-50 dark:hover:bg-slate-700/40 transition shadow-sm"
        >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
            </svg>
            Continue with Google
        </button>
    );
};

export const Login = () => {
    const [tab, setTab] = useState("password");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otpStep, setOtpStep] = useState(false);
    const [otpTokenUserId, setOtpTokenUserId] = useState("");
    const [otpSecret, setOtpSecret] = useState("");
    const [loading, setLoading] = useState(false);
    const [magicSent, setMagicSent] = useState(false);

    const { checkUser } = useApp();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authService.login(email, password);
            await checkUser();
            showToast("Welcome back!", "success");
            navigate("/");
        } catch (err) {
            showToast(err.message || "Invalid credentials", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = await authService.sendEmailOTP(email);
            setOtpTokenUserId(token.userId);
            setOtpStep(true);
            showToast("6-digit code sent to your email!", "info");
        } catch (err) {
            showToast(err.message || "Failed to send OTP", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authService.verifyEmailOTP(otpTokenUserId, otpSecret);
            await checkUser();
            showToast("Logged in via OTP!", "success");
            navigate("/");
        } catch (err) {
            showToast(err.message || "Invalid OTP", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleMagicURL = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authService.sendMagicURL(email);
            setMagicSent(true);
            showToast("Magic login link sent!", "info");
        } catch (err) {
            showToast(err.message || "Failed to send link", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        setLoading(true);
        try {
            await authService.loginAnonymously();
            await checkUser();
            showToast("Signed in as Guest", "info");
            navigate("/");
        } catch (err) {
            showToast(err.message || "Guest sign-in failed", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center p-4 min-h-[calc(100vh-130px)]">
            <div className="w-full max-w-sm bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md space-y-4">
                <div className="text-center">
                    <h2 className="text-xl font-bold">Sign In</h2>
                    <p className="text-xs text-slate-500">Access your media gallery</p>
                </div>

                <div className="space-y-2">
                    <GoogleButton />
                    <button
                        type="button"
                        onClick={handleGuestLogin}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-xs font-medium transition"
                    >
                        <UserX size={14} /> Guest Login
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">or email</span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                </div>

                <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg text-[11px] font-semibold">
                    <button
                        type="button"
                        onClick={() => { setTab("password"); setOtpStep(false); setMagicSent(false); }}
                        className={`py-1.5 rounded-md transition ${tab === "password" ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-xs" : "text-slate-500"}`}
                    >
                        Password
                    </button>
                    <button
                        type="button"
                        onClick={() => { setTab("otp"); setMagicSent(false); }}
                        className={`py-1.5 rounded-md transition ${tab === "otp" ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-xs" : "text-slate-500"}`}
                    >
                        OTP
                    </button>
                    <button
                        type="button"
                        onClick={() => { setTab("magic"); setOtpStep(false); }}
                        className={`py-1.5 rounded-md transition ${tab === "magic" ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-xs" : "text-slate-500"}`}
                    >
                        Magic
                    </button>
                </div>

                {tab === "password" && (
                    <form onSubmit={handlePasswordLogin} className="space-y-3">
                        <div className="relative">
                            <Mail size={16} className="absolute left-3 top-2.5 text-slate-400" />
                            <input
                                type="email"
                                required
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div className="relative">
                            <Lock size={16} className="absolute left-3 top-2.5 text-slate-400" />
                            <input
                                type="password"
                                required
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-xs transition disabled:opacity-50"
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>
                )}

                {tab === "otp" && (
                    <div>
                        {!otpStep ? (
                            <form onSubmit={handleSendOTP} className="space-y-3">
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3 top-2.5 text-slate-400" />
                                    <input
                                        type="email"
                                        required
                                        placeholder="Email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                                >
                                    <KeyRound size={14} /> {loading ? "Sending..." : "Send OTP Code"}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOTP} className="space-y-3">
                                <input
                                    type="text"
                                    required
                                    placeholder="6-digit OTP"
                                    maxLength={6}
                                    value={otpSecret}
                                    onChange={(e) => setOtpSecret(e.target.value)}
                                    className="w-full text-center tracking-widest text-lg font-mono py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-xs transition disabled:opacity-50"
                                >
                                    {loading ? "Verifying..." : "Verify Code"}
                                </button>
                            </form>
                        )}
                    </div>
                )}

                {tab === "magic" && (
                    <div>
                        {!magicSent ? (
                            <form onSubmit={handleMagicURL} className="space-y-3">
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3 top-2.5 text-slate-400" />
                                    <input
                                        type="email"
                                        required
                                        placeholder="Email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                                >
                                    <Sparkles size={14} /> {loading ? "Sending..." : "Send Magic Link"}
                                </button>
                            </form>
                        ) : (
                            <p className="text-center text-xs text-slate-500 py-2">
                                Check <strong>{email}</strong> for your one-click login link.
                            </p>
                        )}
                    </div>
                )}

                <p className="text-center text-xs text-slate-500 pt-1">
                    Don't have an account?{" "}
                    <Link to="/signup" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                        Sign Up
                    </Link>
                </p>
            </div>
        </div>
    );
};

// Compact Signup Form (Fits 100vh effortlessly)
export const Signup = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const { checkUser } = useApp();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authService.register({ email, password, name });
            await checkUser();
            showToast("Account created successfully!", "success");
            navigate("/");
        } catch (err) {
            showToast(err.message || "Failed to create account", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center p-4 min-h-[calc(100vh-130px)]">
            <div className="w-full max-w-sm bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-md space-y-4">
                <div className="text-center">
                    <h2 className="text-xl font-bold">Create Account</h2>
                    <p className="text-xs text-slate-500">Sign up to manage and store media</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-3">
                    <div>
                        <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Full Name</label>
                        <div className="relative">
                            <User size={16} className="absolute left-3 top-2.5 text-slate-400" />
                            <input
                                type="text"
                                required
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Email</label>
                        <div className="relative">
                            <Mail size={16} className="absolute left-3 top-2.5 text-slate-400" />
                            <input
                                type="email"
                                required
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">Password</label>
                        <div className="relative">
                            <Lock size={16} className="absolute left-3 top-2.5 text-slate-400" />
                            <input
                                type="password"
                                required
                                placeholder="Minimum 8 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-xs transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 mt-1"
                    >
                        {loading ? "Creating..." : "Sign Up"} <ArrowRight size={14} />
                    </button>
                </form>

                <p className="text-center text-xs text-slate-500 pt-1">
                    Already registered?{" "}
                    <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
};