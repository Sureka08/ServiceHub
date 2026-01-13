import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-medium text-red-900 mb-2">
            Something went wrong with the map
          </h3>
          <p className="text-red-700 mb-3">
            The map component encountered an error. This usually happens when Google Maps isn't properly configured.
          </p>
          <div className="space-y-2 text-sm text-red-600">
            <p>✅ Popular cities selection still works</p>
            <p>✅ GPS location still works</p>
            <p>✅ Search functionality still works</p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;










