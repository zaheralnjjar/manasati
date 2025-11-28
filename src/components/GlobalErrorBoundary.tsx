import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-red-900 text-white p-8 flex flex-col items-center justify-center text-center">
                    <h1 className="text-3xl font-bold mb-4">عذراً، حدث خطأ غير متوقع</h1>
                    <pre className="bg-black/50 p-4 rounded-lg text-left text-sm overflow-auto max-w-full mb-6" dir="ltr">
                        {this.state.error?.toString()}
                    </pre>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-white text-red-900 px-6 py-2 rounded-lg font-bold hover:bg-gray-200"
                    >
                        تحديث الصفحة
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
