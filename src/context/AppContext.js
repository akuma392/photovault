import React, { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../services/backend";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [theme, setTheme] = useState(
        localStorage.getItem("theme") || "dark"
    );

    useEffect(() => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        localStorage.setItem("theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "dark" ? "light" : "dark"));
    };

    const checkUser = async () => {
        try {
            const activeUser = await authService.getCurrentUser();
            setUser(activeUser);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkUser();
    }, []);

    return (
        <AppContext.Provider value={{ user, setUser, checkUser, loading, theme, toggleTheme }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);