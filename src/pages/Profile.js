// src/pages/Profile.js
import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { authService, mediaService } from "../services/backend";
import { useToast } from "../context/ToastContext";
import { MediaCard } from "../components/MediaCard";
import { User, Lock, Upload, ShieldAlert, Sparkles, CheckCircle2, AlertTriangle, Send, KeyRound } from "lucide-react";

export const Profile = () => {
    const { user, checkUser } = useApp();
    const { showToast } = useToast();

    const [name, setName] = useState("");
    const [favorites, setFavorites] = useState([]);
    const [avatarFile, setAvatarFile] = useState(null);

    const [newPassword, setNewPassword] = useState("");
    const [oldPassword, setOldPassword] = useState("");

    const [anonEmail, setAnonEmail] = useState("");
    const [anonPassword, setAnonPassword] = useState("");
    const [anonName, setAnonName] = useState("");

    // Verification states
    const [sendingVerification, setSendingVerification] = useState(false);
    const [verificationSecret, setVerificationSecret] = useState("");
    const [verifyingCode, setVerifyingCode] = useState(false);

    const [savingName, setSavingName] = useState(false);
    const [savingPass, setSavingPass] = useState(false);
    const [convertingAnon, setConvertingAnon] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || "");
            mediaService
                .getUserFavorites(user.$id)
                .then((res) => setFavorites(res.documents || []))
                .catch(() => showToast("Could not load favorites", "error"));
        }
    }, [user, showToast]);

    if (!user) {
        return <div className="p-8 text-center text-slate-500">Please login to view profile.</div>;
    }

    // Send Verification Email
    const handleSendVerification = async () => {
        setSendingVerification(true);
        try {
            await authService.sendEmailVerification();
            showToast("Verification email sent! Check your inbox for the link or secret code.", "info");
        } catch (err) {
            showToast(err.message || "Failed to send verification email.", "error");
        } finally {
            setSendingVerification(false);
        }
    };

    // Confirm Verification Secret/Code
    const handleVerifySecret = async (e) => {
        e.preventDefault();
        if (!verificationSecret.trim()) {
            showToast("Please enter the verification code or secret from your email.", "error");
            return;
        }
        setVerifyingCode(true);
        try {
            await authService.confirmEmailVerification(user.$id, verificationSecret.trim());
            await checkUser();
            showToast("Email verified successfully! You can now upload, favorite, and download media.", "success");
            setVerificationSecret("");
        } catch (err) {
            showToast(err.message || "Verification code is invalid or expired.", "error");
        } finally {
            setVerifyingCode(false);
        }
    };

    const handleNameUpdate = async (e) => {
        e.preventDefault();
        setSavingName(true);
        try {
            await authService.updateProfileName(name);
            await checkUser();
            showToast("Display name updated!", "success");
        } catch (err) {
            showToast(err.message || "Failed to update name", "error");
        } finally {
            setSavingName(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setSavingPass(true);
        try {
            await authService.setOrUpdatePassword(newPassword, oldPassword);
            showToast("Password saved successfully!", "success");
            setNewPassword("");
            setOldPassword("");
        } catch (err) {
            showToast(err.message || "Failed to update password", "error");
        } finally {
            setSavingPass(false);
        }
    };

    const handleAvatarUpload = async () => {
        if (!avatarFile) return;
        try {
            await authService.updateAvatar(avatarFile);
            await checkUser();
            showToast("Avatar updated successfully!", "success");
            setAvatarFile(null);
        } catch (err) {
            showToast(err.message || "Failed to upload avatar", "error");
        }
    };

    const handleConvertAnonymous = async (e) => {
        e.preventDefault();
        setConvertingAnon(true);
        try {
            await authService.linkAnonymousAccount(anonEmail, anonPassword, anonName);
            await checkUser();
            showToast("Guest session converted to permanent account!", "success");
        } catch (err) {
            showToast(err.message || "Failed to link account", "error");
        } finally {
            setConvertingAnon(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
            {/* Guest Banner */}
            {user.isAnonymous && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex gap-3 items-start">
                        <ShieldAlert className="text-amber-600 mt-1 shrink-0" size={24} />
                        <div>
                            <h3 className="font-bold text-amber-900 dark:text-amber-200">You are currently logged in as a Guest</h3>
                            <p className="text-xs text-amber-700 dark:text-amber-400">
                                Link an email below to retain your favorites and uploads permanently.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Profile Info Card */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
                <div className="relative">
                    {user.avatarUrl ? (
                        <img
                            src={user.avatarUrl}
                            alt="Avatar"
                            className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500 shadow-md"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                            <User size={40} className="text-slate-400" />
                        </div>
                    )}
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <h2 className="text-2xl font-bold">{user.name || "Unnamed User"}</h2>
                        {user.isAdmin && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                Admin
                            </span>
                        )}
                        {user.isAnonymous && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                Guest
                            </span>
                        )}
                        {/* Email Verification Badge */}
                        {!user.isAnonymous && (
                            <span
                                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 ${user.emailVerification
                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                        : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                    }`}
                            >
                                {user.emailVerification ? (
                                    <>
                                        <CheckCircle2 size={12} /> Verified
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle size={12} /> Unverified
                                    </>
                                )}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-500">{user.email || "No email linked (Anonymous session)"}</p>

                    <div className="flex items-center gap-2 pt-2 justify-center sm:justify-start">
                        <input
                            type="file"
                            accept="image/*"
                            id="avatarFile"
                            className="hidden"
                            onChange={(e) => setAvatarFile(e.target.files[0])}
                        />
                        <label
                            htmlFor="avatarFile"
                            className="cursor-pointer text-xs border border-slate-300 dark:border-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                        >
                            Choose Avatar
                        </label>
                        {avatarFile && (
                            <button
                                onClick={handleAvatarUpload}
                                className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition"
                            >
                                <Upload size={14} /> Upload
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Email Verification Section */}
            {!user.isAnonymous && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2 text-sm">
                            <KeyRound size={16} className="text-indigo-600" /> Email Verification
                        </h3>
                        {user.emailVerification ? (
                            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                                <CheckCircle2 size={14} /> Account Fully Verified
                            </span>
                        ) : (
                            <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                                <AlertTriangle size={14} /> Action Required
                            </span>
                        )}
                    </div>

                    {user.emailVerification ? (
                        <p className="text-xs text-slate-500">
                            Your email <strong>{user.email}</strong> is verified. You have full access to uploading, favoriting, and downloading media.
                        </p>
                    ) : (
                        <div className="space-y-4 pt-1">
                            <p className="text-xs text-slate-500">
                                Your email is not verified yet. Verification is required to <strong>upload media</strong>, <strong>add favorites</strong>, and <strong>download files</strong>.
                            </p>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleSendVerification}
                                    disabled={sendingVerification}
                                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-semibold transition disabled:opacity-50"
                                >
                                    <Send size={14} /> {sendingVerification ? "Sending..." : "Send Verification Email / Code"}
                                </button>
                            </div>

                            {/* Enter Secret/Code Form */}
                            <form onSubmit={handleVerifySecret} className="flex flex-col sm:flex-row gap-3 pt-2">
                                <input
                                    type="text"
                                    placeholder="Paste verification secret or code from email..."
                                    value={verificationSecret}
                                    onChange={(e) => setVerificationSecret(e.target.value)}
                                    className="flex-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={verifyingCode}
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
                                >
                                    {verifyingCode ? "Verifying..." : "Verify Code"}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name Form */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                    <h3 className="font-bold flex items-center gap-2 text-sm">
                        <User size={16} /> Edit Display Name
                    </h3>
                    <form onSubmit={handleNameUpdate} className="space-y-3">
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your Name"
                            className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <button
                            type="submit"
                            disabled={savingName}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                        >
                            {savingName ? "Saving Name..." : "Save Name"}
                        </button>
                    </form>
                </div>

                {/* Password or Link Account Form */}
                {!user.isAnonymous ? (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                        <h3 className="font-bold flex items-center gap-2 text-sm">
                            <Lock size={16} /> Set or Update Password
                        </h3>
                        <form onSubmit={handlePasswordSubmit} className="space-y-3">
                            <input
                                type="password"
                                placeholder="Old Password (leave blank if setting first time)"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <input
                                type="password"
                                required
                                placeholder="New Password (min 8 chars)"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <button
                                type="submit"
                                disabled={savingPass}
                                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                            >
                                {savingPass ? "Saving Password..." : "Save Password"}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                        <h3 className="font-bold flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
                            <Sparkles size={16} /> Link Email to Guest Account
                        </h3>
                        <form onSubmit={handleConvertAnonymous} className="space-y-3">
                            <input
                                type="text"
                                required
                                placeholder="Your Full Name"
                                value={anonName}
                                onChange={(e) => setAnonName(e.target.value)}
                                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <input
                                type="email"
                                required
                                placeholder="Email Address"
                                value={anonEmail}
                                onChange={(e) => setAnonEmail(e.target.value)}
                                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <input
                                type="password"
                                required
                                placeholder="Set a Password (min 8 chars)"
                                value={anonPassword}
                                onChange={(e) => setAnonPassword(e.target.value)}
                                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <button
                                type="submit"
                                disabled={convertingAnon}
                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                            >
                                {convertingAnon ? "Linking Account..." : "Save & Make Permanent"}
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Favorites Section */}
            <div>
                <h3 className="text-xl font-bold mb-4">My Favorite Media</h3>
                {favorites.length === 0 ? (
                    <p className="text-slate-500 text-sm">No favorites saved yet.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {favorites.map((item) => (
                            <MediaCard key={item.$id} item={item} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};