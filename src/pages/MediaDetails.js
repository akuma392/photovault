import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { mediaService } from "../services/backend";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import { Heart, Trash2, Save, Download, ArrowLeft, Loader2 } from "lucide-react";

export const MediaDetails = () => {
    const { id } = useParams();
    const { user } = useApp();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [item, setItem] = useState(null);
    const [isFav, setIsFav] = useState(false);
    const [favCount, setFavCount] = useState(0);
    const [desc, setDesc] = useState("");
    const [isPub, setIsPub] = useState(true);
    const [saving, setSaving] = useState(false);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        mediaService
            .getMediaById(id)
            .then((doc) => {
                setItem(doc);
                setDesc(doc.description || "");
                setIsPub(doc.isPublic ?? true);
                setFavCount(doc.favoritesCount || 0);
            })
            .catch(() => {
                showToast("Media not found.", "error");
                navigate("/");
            });
    }, [id, navigate, showToast]);

    useEffect(() => {
        if (user && item) {
            mediaService.checkIsFavorite(user.$id, item.$id).then(setIsFav);
        }
    }, [user, item]);

    if (!item) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-slate-500">
                <Loader2 className="animate-spin text-indigo-600 mb-3" size={36} />
                <p className="text-sm">Loading media details...</p>
            </div>
        );
    }

    const isOwner = user && user.$id === item.userId;
    const mediaUrl = mediaService.getMediaUrl(item.fileId);
    const isVideo = item.mediaType === "video";

    // Handle direct download with verification check
    const handleDownload = async () => {
        if (!user) {
            showToast("Please log in to download media.", "error");
            return;
        }

        if (!user.emailVerification && !user.isAdmin) {
            showToast("Please verify your email in Profile to download media.", "error");
            return;
        }

        setDownloading(true);
        try {
            const urlToFetch =
                typeof mediaService.getMediaDownloadUrl === "function"
                    ? mediaService.getMediaDownloadUrl(item.fileId)
                    : mediaService.getMediaUrl(item.fileId);

            const response = await fetch(urlToFetch);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = blobUrl;
            const extension = isVideo ? "mp4" : "jpg";
            link.download = `photovault-${item.$id}.${extension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

            showToast("Download started!", "success");
        } catch (err) {
            showToast("Failed to download file.", "error");
        } finally {
            setDownloading(false);
        }
    };

    // Handle favorite with verification check
    const handleToggleFav = async () => {
        if (!user) {
            showToast("Please log in to favorite!", "error");
            return;
        }

        if (!user.emailVerification && !user.isAdmin) {
            showToast("Please verify your email in Profile to add favorites.", "error");
            return;
        }

        try {
            const { isFavorited, newCount } = await mediaService.toggleFavorite(user.$id, item.$id);
            setIsFav(isFavorited);
            setFavCount(newCount);
            showToast(isFavorited ? "Added to favorites" : "Removed from favorites", "success");
        } catch (err) {
            showToast(err.message || "Failed to update favorite", "error");
        }
    };

    const handleUpdate = async () => {
        setSaving(true);
        try {
            await mediaService.updateMedia(item.$id, { description: desc, isPublic: isPub });
            showToast("Updated successfully!", "success");
        } catch (err) {
            showToast(err.message || "Failed to update media.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to permanently delete this media?")) return;
        try {
            await mediaService.deleteMedia(item.$id, item.fileId);
            showToast("Media deleted successfully.", "success");
            navigate("/");
        } catch (err) {
            showToast(err.message || "Failed to delete media.", "error");
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-6 transition"
            >
                <ArrowLeft size={16} /> Back to Gallery
            </button>

            <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xl">
                {/* Media Preview Area */}
                <div className="w-full max-h-[600px] bg-slate-950 flex items-center justify-center relative">
                    {isVideo ? (
                        <video src={mediaUrl} controls autoPlay muted className="w-full max-h-[600px] object-contain" />
                    ) : (
                        <img src={mediaUrl} alt={item.description} className="w-full max-h-[600px] object-contain" />
                    )}
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                    {/* Header Action Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-6">
                        <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                Uploaded by <span className="text-indigo-600 dark:text-indigo-400">{item.userName}</span>
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {new Date(item.createdAt).toLocaleDateString(undefined, {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Direct Download */}
                            <button
                                onClick={handleDownload}
                                disabled={downloading}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-300 rounded-xl text-xs font-semibold transition shadow-xs disabled:opacity-50"
                            >
                                {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                                {downloading ? "Downloading..." : `Download ${isVideo ? "Video" : "Image"}`}
                            </button>

                            {/* Favorite Action */}
                            <button
                                onClick={handleToggleFav}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-xs font-semibold transition"
                            >
                                <Heart size={15} className={isFav ? "fill-rose-500 text-rose-500" : "text-slate-400"} />
                                <span>{favCount}</span>
                            </button>
                        </div>
                    </div>

                    {/* Description & Author Controls */}
                    {isOwner ? (
                        <div className="space-y-4">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Media Description
                            </label>
                            <textarea
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                                placeholder="Add a description..."
                                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                rows="3"
                            />

                            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={isPub}
                                        onChange={(e) => setIsPub(e.target.checked)}
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    Publicly visible in feed
                                </label>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleDelete}
                                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition shadow-xs"
                                    >
                                        <Trash2 size={14} /> Delete
                                    </button>
                                    <button
                                        onClick={handleUpdate}
                                        disabled={saving}
                                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-xs disabled:opacity-50"
                                    >
                                        <Save size={14} /> {saving ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Description</h3>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                {item.description || "No description provided."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};