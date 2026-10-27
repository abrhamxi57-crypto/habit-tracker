import React, { useState } from 'react';
import { X, Lock, Mail, User, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { authService } from '../../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!displayName.trim()) {
          throw new Error('Please provide your name');
        }
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters');
        }
        await authService.register({
          email,
          password,
          display_name: displayName,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        });
      } else {
        await authService.login({ email, password });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        background: 'rgba(10, 13, 20, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: '#16191e',
          border: '1px solid #2a2f38',
          borderRadius: '1rem',
          width: '100%',
          maxWidth: 400,
          padding: '1.75rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            color: '#a0a4aa',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, #9b6df4, #b78af7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem',
              color: '#0f1115',
            }}
          >
            <Sparkles size={20} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#f4f4f5' }}>
            {isRegister ? 'Join HabitFlow' : 'Welcome Back'}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#a0a4aa' }}>
            {isRegister
              ? 'Create an account to synchronize habits across devices'
              : 'Sign in to sync your habits, streaks, and analytics'}
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '0.5rem',
              padding: '0.625rem 0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: '1rem',
              color: '#f87171',
              fontSize: '0.75rem',
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {isRegister && (
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#a0a4aa', marginBottom: 4 }}>
                Display Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: 10, top: 10, color: '#71757e' }} />
                <input
                  type="text"
                  required
                  placeholder="Alex Mercer"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem 0.5rem 2.1rem',
                    background: '#21252d',
                    border: '1px solid #2a2f38',
                    borderRadius: '0.5rem',
                    color: '#f4f4f5',
                    fontSize: '0.8125rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#a0a4aa', marginBottom: 4 }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 10, top: 10, color: '#71757e' }} />
              <input
                type="email"
                required
                placeholder="alex@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2.1rem',
                  background: '#21252d',
                  border: '1px solid #2a2f38',
                  borderRadius: '0.5rem',
                  color: '#f4f4f5',
                  fontSize: '0.8125rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#a0a4aa', marginBottom: 4 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: 10, top: 10, color: '#71757e' }} />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2.1rem',
                  background: '#21252d',
                  border: '1px solid #2a2f38',
                  borderRadius: '0.5rem',
                  color: '#f4f4f5',
                  fontSize: '0.8125rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            {isRegister && (
              <p style={{ margin: '3px 0 0', fontSize: '0.65rem', color: '#71757e' }}>
                Must be at least 8 characters with numbers or symbols.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              padding: '0.625rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: 'linear-gradient(135deg, #9b6df4, #b78af7)',
              color: '#0f1115',
              fontWeight: 800,
              fontSize: '0.8125rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', textAlign: 'center', borderTop: '1px solid #2a2f38', paddingTop: '1rem' }}>
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#b78af7',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
};
