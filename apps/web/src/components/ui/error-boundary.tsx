'use client';

import { Component } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary]', error);
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
          <div className="text-5xl">⚠️</div>
          <h1 className="text-xl font-semibold text-text-primary">
            {this.props.fallbackTitle ?? 'Something went wrong'}
          </h1>
          <p className="max-w-md text-sm text-text-secondary">
            {this.props.fallbackDescription ?? 'An unexpected error occurred. Please try again.'}
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="mt-2 max-w-lg overflow-auto rounded-card bg-content-input p-3 text-left text-xs text-red-400">
              {this.state.error.message}
            </pre>
          )}
          <div className="mt-2 flex gap-3">
            <Button variant="primary" onClick={this.reset}>
              Try Again
            </Button>
            <Link href="/" className="btn-secondary">
              Go Home
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
