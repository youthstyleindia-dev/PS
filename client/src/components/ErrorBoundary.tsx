import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('UniVerse ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b1326] text-white p-8 font-mono flex flex-col items-center justify-center">
          <div className="max-w-2xl w-full bg-[#121c33] border border-red-500/50 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <span className="material-symbols-outlined text-3xl">error</span>
              <h2 className="text-lg font-bold uppercase tracking-wider">UniVerse Runtime Diagnostic Catch</h2>
            </div>
            
            <p className="text-xs text-slate-300">
              An unhandled React render error was intercepted. Details below:
            </p>

            <div className="p-3 bg-black/60 border border-slate-700 text-red-300 text-xs overflow-x-auto whitespace-pre-wrap font-mono">
              <strong>{this.state.error?.name}:</strong> {this.state.error?.message}
            </div>

            {this.state.error?.stack && (
              <details className="text-[11px] text-slate-400">
                <summary className="cursor-pointer hover:text-white">Stack Trace</summary>
                <pre className="mt-2 p-2 bg-black/40 overflow-x-auto">{this.state.error.stack}</pre>
              </details>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                  window.location.href = '/';
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase transition-colors"
              >
                Return to Campus Home
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                  window.location.reload();
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold uppercase transition-colors"
              >
                Reload Enclave
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
