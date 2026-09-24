import React, { ErrorInfo, ReactNode } from 'react';
import { RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  className?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error during component rendering:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public handleTryAgain = () => {
    this.handleReset();
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public render() {
    const { fallback, children, className } = this.props;
    const { hasError } = this.state;

    if (hasError) {
      if (fallback) {
        return fallback;
      }
      return (
        <div className={`flex flex-col items-center justify-center p-8 sm:p-10 text-center space-y-4 bg-card border border-border/70 rounded-2xl max-w-lg mx-auto my-6 sm:my-10 shadow-sm ${className || ''}`}>
          <img
            src="/images/undraw_page-not-found_6wni (1).svg"
            alt="Rendering Error"
            className="w-56 max-w-full h-auto object-contain mx-auto mb-2 pointer-events-none drop-shadow-2xs select-none"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.includes('Unused%20Icons')) {
                target.src = '/images/Unused Icons/undraw_page-not-found_6wni (1).svg';
              }
            }}
          />
          <div className="space-y-1">
            <h3 className="font-bold text-base text-foreground">Something went wrong</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              We encountered an unexpected error while rendering this view. You can try refreshing or reloading the page.
            </p>
          </div>
          <div className="pt-1.5">
            <Button 
              size="sm" 
              variant="primary" 
              onClick={this.handleTryAgain}
              className="gap-1.5 font-bold text-xs rounded-xl shadow-2xs cursor-pointer active:scale-95"
            >
              <RotateCcw className="size-3.5" />
              <span>Try Again</span>
            </Button>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
