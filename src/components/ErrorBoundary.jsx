import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary prins:', error, errorInfo);
    // Dacă este o eroare legată de încărcarea chunk-urilor de la Vite, dăm reload la pagină
    if (error.name === 'ChunkLoadError' || (error.message && error.message.includes('Failed to fetch dynamically imported module'))) {
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-primary)' }}>
          <h2>{t('alerts.errorTitle') || "Oops! S-a produs o eroare 😢"}</h2>
          <p>{this.state.error?.message}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '10px 20px',
              borderRadius: '20px',
              background: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Reîncarcă aplicația
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
