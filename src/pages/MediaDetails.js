import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { mediaService } from "../services/backend";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import { Heart, Trash2, Save, Video, Image as ImageIcon } from "lucide-react";

export const MediaDetails = () => {
    const { id } = useParams();
    const { user } = useApp();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [item, setItem] = useState(null);
    const [isFav, setIsFav] = useState(false);
    const [desc, setDesc] = useState("");
    const [isPub, setIsPub] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        mediaService.getMediaById(id).then((doc) => {
            setItem(doc);
            setDesc(doc.description);
            setIsPub(doc.isPublic);
        });
    }, [id]);

    useEffect(() => {
        if (user && item) {
            mediaService.checkIsFavorite(user.$id, item.$id).then(setIsFav);
        }
    }, [user, item]);

    if (!item) return <div className="p-8 text-center text-slate-500">Loading media...</div>;

    const isOwner = user && user.$id === item.userId;
    const mediaUrl = mediaService.getMediaUrl(item.fileId);
    const isVideo = item.mediaType === "video";

    const handleUpdate = async () => {
        setSaving(true);
        try {
            await mediaService.updateMedia(item.$id, { description: desc, isPublic: isPub });
            showToast("Updated successfully!", "success");
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this media?")) return;
        try {
            await mediaService.deleteMedia(item.$id, item.fileId);
            showToast("Media deleted", "success");
            navigate("/");
        } catch (err) {
            showToast(err.message, "error");
        }
    };

    const handleToggleFav = async () => {
        if (!user) {
            showToast("Please log in to favorite!", "error");
            return;
        }
        const st = await mediaService.toggleFavorite(user.$id, item.$id);
        setIsFav(st);
        showToast(st ? "Added to favorites" : "Removed from favorites", "success");
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg">
                {isVideo ? (
                    <video src={mediaUrl} controls className="w-full max-h-[600px] object-contain bg-black" />
                ) : (
                    <img src={mediaUrl} alt={item.description} className="w-full max-h-[600px] object-contain bg-black" />
                )}

                <div className="p-6">
                    <div className="flex justify-between items-start gap-4">
                        <div>
                            <p className="text-xs text-slate-400">Uploaded by {item.userName}</p>
                            <p className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</p>
                        </div>

                        <button
                            onClick={handleToggleFav}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                        >
                            <Heart size={18} className={isFav ? "fill-rose-500 text-rose-500" : ""} />
                            <span className="text-sm font-medium">{isFav ? "Favorited" : "Favorite"}</span>
                        </button>
                    </div>

                    {isOwner ? (
                        <div className="mt-6 space-y-4 border-t border-slate-200 dark:border-slate-700 pt-6">
                            <h3 className="font-semibold text-sm">Author Controls</h3>
                            <textarea
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                                className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                rows="3"
                            />
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isPub}
                                        onChange={(e) => setIsPub(e.target.checked)}
                                        className="rounded text-indigo-600"
                                    />
                                    Publicly visible
                                </label>

                                <div className="flex gap-2">
                                    <button
                                        onClick={handleDelete}
                                        className="flex items-center gap-1 px-3 py-2 text-sm bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition"
                                    >
                                        <Trash2 size={16} /> Delete
                                    </button>
                                    <button
                                        onClick={handleUpdate}
                                        disabled={saving}
                                        className="flex items-center gap-1 px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
                                    >
                                        <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
                            <p className="text-slate-700 dark:text-slate-300">{item.description}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};