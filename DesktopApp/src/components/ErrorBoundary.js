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
    console.error('App error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '60px 40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#dc3545', marginBottom: '16px' }}>Something went wrong</h2>
          <p style={{ color: '#666', marginBottom: '8px', fontSize: '14px' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <p style={{ color: '#999', marginBottom: '24px', fontSize: '13px' }}>
            Check the console for more details.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '10px 24px',
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
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
