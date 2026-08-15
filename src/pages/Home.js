// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { mediaService } from "../services/backend";
import { useApp } from "../context/AppContext";
import { MediaCard } from "../components/MediaCard";

export const Home = () => {
    const { user } = useApp();
    const [mediaList, setMediaList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        mediaService
            .getFeedMedia(user?.$id)
            .then(setMediaList)
            .finally(() => setLoading(false));
    }, [user]);

    if (loading) return <div className="p-12 text-center text-slate-500">Loading gallery...</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {mediaList.length === 0 ? (
                <div className="text-center py-24 text-slate-500">
                    <p className="text-lg font-medium">No media uploaded yet.</p>
                    <p className="text-sm text-slate-400 mt-1">Upload your first image or video to see it here!</p>
                </div>
            ) : (
                /* Reduced from 4 columns to 3 columns for bigger, clearer cards */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {mediaList.map((item) => (
                        <MediaCard key={item.$id} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
};