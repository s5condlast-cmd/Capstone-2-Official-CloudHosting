import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    (this as any).state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    const { fallback, children } = (this as any).props;
    const { hasError } = (this as any).state;

    if (hasError) {
      if (fallback) {
        return fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl">
          <AlertTriangle className="w-12 h-12 text-red-500" />
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Something went wrong</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs">We encountered an error rendering this section. You can try refreshing the page.</p>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
        </div>
      );
    }

    return children;
  }
}
