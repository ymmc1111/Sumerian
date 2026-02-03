import React from 'react';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col h-screen w-screen bg-nexus-bg-primary text-nexus-fg-primary p-12 items-center justify-center font-sans">
                    <div className="bg-red-500/10 border border-red-500/50 p-8 rounded-2xl max-w-xl w-full space-y-4">
                        <h1 className="text-xl font-bold text-red-500">Something went wrong</h1>
                        <p className="text-sm text-nexus-fg-secondary">
                            A rendering error occurred in the Sumerian UI.
                        </p>
                        <pre className="text-[10px] bg-black/50 p-4 rounded overflow-auto max-h-40 font-mono text-red-400">
                            {this.state.error?.message}
                            {"\n"}
                            {this.state.error?.stack}
                        </pre>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-nexus-bg-tertiary hover:bg-nexus-bg-accent rounded-lg text-sm transition-colors"
                        >
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
