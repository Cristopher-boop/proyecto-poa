import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturó un error no manejado:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-theme-base animate-in fade-in">
          <div className="w-full max-w-lg bg-theme-surface border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center ring-8 ring-rose-500/5">
              <AlertCircle size={32} />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-theme-main">
                {this.props.fallbackTitle || 'Se produjo un error en la interfaz'}
              </h3>
              <p className="text-xs text-theme-muted leading-relaxed">
                {this.props.fallbackMessage ||
                  'Ocurrió una excepción al procesar la vista. Los datos del POA se encuentran protegidos.'}
              </p>
            </div>

            {this.state.error && (
              <div className="text-left p-3 rounded-xl bg-slate-900/90 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-36">
                <span className="text-rose-400 font-bold block mb-1">
                  {this.state.error.name}: {this.state.error.message}
                </span>
                {this.state.error.stack && (
                  <pre className="text-[10px] text-slate-400 opacity-80 whitespace-pre-wrap">
                    {this.state.error.stack.split('\n').slice(0, 4).join('\n')}
                  </pre>
                )}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleGoHome}
                icon={<Home size={15} />}
                className="text-xs"
              >
                Ir al Inicio
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={this.handleReset}
                icon={<RefreshCw size={15} />}
                className="text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white"
              >
                Recargar Sistema
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
