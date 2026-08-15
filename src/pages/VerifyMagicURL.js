// src/pages/VerifyMagicURL.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "../services/backend";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import { Loader2 } from "lucide-react";

export const VerifyMagicURL = () => {
    const [searchParams] = useSearchParams();
    const { checkUser } = useApp();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [verifying, setVerifying] = useState(true);

    useEffect(() => {
        const userId = searchParams.get("userId");
        const secret = searchParams.get("secret");

        if (!userId || !secret) {
            showToast("Invalid or missing magic link parameters.", "error");
            navigate("/login");
            return;
        }

        authService
            .verifyMagicURL(userId, secret)
            .then(async () => {
                await checkUser();
                showToast("Authenticated successfully!", "success");
                navigate("/");
            })
            .catch((err) => {
                showToast(err.message || "Failed to verify magic link.", "error");
                navigate("/login");
            })
            .finally(() => setVerifying(false));
    }, [searchParams, checkUser, showToast, navigate]);

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
            <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
            <h2 className="text-xl font-bold">Verifying Magic Link...</h2>
            <p className="text-sm text-slate-500 mt-1">Please wait while we establish your secure session.</p>
        </div>
    );
};