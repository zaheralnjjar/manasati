import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
                    <div className="bg-red-500/10 p-4 rounded-full mb-4">
                        <AlertTriangle size={48} className="text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">عذراً، حدث خطأ غير متوقع</h2>
                    <p className="text-slate-400 mb-6 max-w-md">
                        {this.state.error?.message || 'حدث خطأ أثناء عرض هذا القسم.'}
                    </p>
                    <button
                        onClick={this.handleRetry}
                        className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <RefreshCw size={20} />
                        <span>إعادة تحميل الصفحة</span>
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
