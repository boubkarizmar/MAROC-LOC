import React, { Component, ReactNode } from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

interface Props extends WithTranslation {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryBase extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
    // TODO: send to production error tracker (e.g. Sentry)
  }

  render() {
    const { t } = this.props;
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center dark:bg-slate-900">
          <div className="max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-800">
            <h1 className="mb-2 text-xl font-bold text-slate-900 dark:text-slate-100">
              {t('errorBoundary.title', 'Something went wrong')}
            </h1>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
              {this.state.error?.message || t('errorBoundary.subtitle', 'An unexpected error occurred.')}
            </p>
            {import.meta.env.DEV && this.state.error?.stack && (
              <pre className="mb-6 max-h-40 overflow-auto rounded-lg bg-slate-100 p-3 text-left text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                {this.state.error.stack}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition"
            >
              {t('errorBoundary.reload', 'Reload page')}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const ErrorBoundary = withTranslation()(ErrorBoundaryBase);
