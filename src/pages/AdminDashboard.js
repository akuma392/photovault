import React, { useEffect, useState } from "react";
import { adminService, isPermittedAdmin } from "../services/backend";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import { Shield, UserX, UserCheck, User } from "lucide-react";

export const AdminDashboard = () => {
    const { user } = useApp();
    const { showToast } = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            const list = await adminService.getAllUsers();
            setUsers(list);
        } catch (err) {
            showToast("Failed to load user profiles", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleToggleBlock = async (profile) => {
        const newStatus = !profile.isBlocked;
        try {
            await adminService.toggleBlockUser(profile.$id, newStatus);
            showToast(`User ${newStatus ? "blocked" : "unblocked"} successfully`, "success");
            fetchUsers();
        } catch (err) {
            showToast(err.message || "Failed to update user status", "error");
        }
    };

    if (!user?.isAdmin) {
        return (
            <div className="p-12 text-center text-rose-500 font-semibold">
                Access Denied: Admin authorization required (admin1 / admin2).
            </div>
        );
    }

    if (loading) return <div className="p-8 text-center text-slate-500">Loading admin panel...</div>;

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
            <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-xl">
                    <Shield size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Admin Console</h1>
                    <p className="text-sm text-slate-500">
                        Authorized session: <span className="font-semibold text-slate-700 dark:text-slate-200">{user.email}</span>
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-xs uppercase tracking-wider text-slate-500">
                                <th className="p-4">User</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                            {users.map((u) => {
                                const isAdmin = isPermittedAdmin(u.email);
                                return (
                                    <tr key={u.$id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                                        <td className="p-4 flex items-center gap-3">
                                            {u.avatarUrl ? (
                                                <img src={u.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                                    <User size={18} />
                                                </div>
                                            )}
                                            <span className="font-medium">{u.name}</span>
                                        </td>
                                        <td className="p-4 text-slate-500">{u.email}</td>
                                        <td className="p-4">
                                            <span
                                                className={`text-xs px-2.5 py-1 rounded-full font-semibold ${isAdmin
                                                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                                        : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                                                    }`}
                                            >
                                                {isAdmin ? "Admin" : "Standard User"}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span
                                                className={`text-xs px-2.5 py-1 rounded-full font-semibold ${u.isBlocked
                                                        ? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                                        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                                    }`}
                                            >
                                                {u.isBlocked ? "Blocked" : "Active"}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {!isAdmin ? (
                                                <button
                                                    onClick={() => handleToggleBlock(u)}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${u.isBlocked
                                                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                                            : "bg-rose-600 hover:bg-rose-700 text-white"
                                                        }`}
                                                >
                                                    {u.isBlocked ? <UserCheck size={14} /> : <UserX size={14} />}
                                                    {u.isBlocked ? "Unblock" : "Block"}
                                                </button>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">Admin (Protected)</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};