import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { mediaService } from "../services/backend";
import { useToast } from "../context/ToastContext";
import { Upload as UploadIcon, ArrowLeft } from "lucide-react";

export const Upload = () => {
    const { user } = useApp();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [file, setFile] = useState(null);
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            showToast("Please select an image or video file.", "error");
            return;
        }

        setLoading(true);
        try {
            await mediaService.uploadMedia({ file, description, isPublic, user });
            showToast("Media uploaded successfully!", "success");
            navigate("/");
        } catch (err) {
            showToast(err.message || "Failed to upload media.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto px-4 py-12">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-6 transition"
            >
                <ArrowLeft size={16} /> Back
            </button>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-xl">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <UploadIcon className="text-indigo-600" /> Upload Image or Video
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                            Select File (Image / Video)
                        </label>
                        <input
                            type="file"
                            accept="image/*,video/*"
                            required
                            onChange={(e) => setFile(e.target.files[0])}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-slate-700 dark:file:text-slate-200 cursor-pointer"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                            Description
                        </label>
                        <textarea
                            placeholder="Write something about this media..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            rows="4"
                        />
                    </div>

                    <label className="flex items-center gap-3 text-sm cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        Make this media publicly visible in feed
                    </label>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50 shadow-lg shadow-indigo-600/20"
                    >
                        {loading ? "Uploading Media..." : "Upload Now"}
                    </button>
                </form>
            </div>
        </div>
    );
};