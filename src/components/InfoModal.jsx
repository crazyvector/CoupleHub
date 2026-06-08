import React from 'react';

export default function InfoModal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        className="animate-scale-in"
        style={{
          background: 'var(--bg-card)', padding: '20px', borderRadius: '16px',
          width: '100%', maxWidth: '400px', boxShadow: 'var(--shadow-lg)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
        >
          ✕
        </button>
        <h2 style={{ marginTop: 0, marginBottom: '15px', fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>ℹ️</span> {title}
        </h2>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
          {children}
        </div>
        <button 
          onClick={onClose}
          style={{ width: '100%', marginTop: '20px', padding: '12px', background: 'var(--color-rose-dark)', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Am înțeles
        </button>
      </div>
    </div>
  );
}
