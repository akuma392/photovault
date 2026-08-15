// src/components/ErrorBoundary.jsx
import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    handleReload = () => {
        this.setState({ hasError: false });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mb-4">
                        <AlertTriangle size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                        Something went wrong
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
                        {this.state.error?.message || "An unexpected error occurred while rendering this page."}
                    </p>
                    <button
                        onClick={this.handleReload}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow transition"
                    >
                        <RefreshCw size={16} /> Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}