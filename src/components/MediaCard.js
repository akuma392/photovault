import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { mediaService } from "../services/backend";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import { Heart, Globe, Lock, ExternalLink, Video, Image as ImageIcon } from "lucide-react";

export const MediaCard = ({ item }) => {
    const { user } = useApp();
    const { showToast } = useToast();
    const [isFav, setIsFav] = useState(false);
    const [favCount, setFavCount] = useState(item.favoritesCount || 0);

    useEffect(() => {
        setFavCount(item.favoritesCount || 0);
        if (user) {
            mediaService.checkIsFavorite(user.$id, item.$id).then(setIsFav);
        }
    }, [user, item]);

    const handleFavorite = async (e) => {
        e.preventDefault();
        if (!user) {
            showToast("Please login to add to favorites!", "error");
            return;
        }

        // Check email verification before allowing favorite
        if (!user.emailVerification && !user.isAdmin) {
            showToast("Please verify your email in Profile before adding favorites.", "error");
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

    const mediaUrl = mediaService.getMediaUrl(item.fileId);
    const isVideo = item.mediaType === "video";

    return (
        <div className="group rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300">
            {/* Media Display Container */}
            <div className="relative w-full h-72 sm:h-80 bg-slate-950 flex items-center justify-center overflow-hidden">
                {!isVideo && (
                    <img
                        src={mediaUrl}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-110"
                    />
                )}

                {isVideo ? (
                    <video
                        src={mediaUrl}
                        className="relative z-10 w-full h-full object-contain"
                        muted
                        controls
                    />
                ) : (
                    <img
                        src={mediaUrl}
                        alt={item.description || "Uploaded media"}
                        className="relative z-10 w-full h-full object-contain p-1 group-hover:scale-105 transition duration-300"
                        loading="lazy"
                    />
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 z-20 flex gap-1.5">
                    <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 shadow-md backdrop-blur-md ${item.isPublic
                                ? "bg-emerald-500/90 text-white"
                                : "bg-amber-500/90 text-white"
                            }`}
                    >
                        {item.isPublic ? <Globe size={13} /> : <Lock size={13} />}
                        {item.isPublic ? "Public" : "Private"}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 bg-black/70 text-white shadow-md backdrop-blur-md">
                        {isVideo ? <Video size={13} /> : <ImageIcon size={13} />}
                        {isVideo ? "Video" : "Image"}
                    </span>
                </div>

                {/* Favorite Button with Live Counter */}
                <button
                    onClick={handleFavorite}
                    className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:text-rose-500 hover:scale-105 transition shadow-md"
                    aria-label="Favorite"
                >
                    <Heart size={16} className={isFav ? "fill-rose-500 text-rose-500" : ""} />
                    <span className="text-xs font-semibold">{favCount}</span>
                </button>
            </div>

            {/* Card Content */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                    <p className="text-sm font-medium leading-snug line-clamp-2 text-slate-800 dark:text-slate-200">
                        {item.description || "No description provided."}
                    </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="truncate max-w-[150px]">By {item.userName}</span>
                    <Link
                        to={`/media/${item.$id}`}
                        className="flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                    >
                        See More <ExternalLink size={13} />
                    </Link>
                </div>
            </div>
        </div>
    );
};