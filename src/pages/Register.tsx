import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirmPw) { setError('Passwords do not match'); return; }
    if (username.length < 3) { setError('Username must be at least 3 characters'); return; }

    setLoading(true);
    try {
      const success = await register(email, username, password);
      if (success) {
        navigate('/');
      } else {
        setError('Registration failed. That email may already be in use.');
      }
    } catch (err) {
      setError('Registration failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="font-display mb-6" style={{ color: 'var(--text)' }}>Create Account</h2>

      <button
        type="button"
        onClick={() => loginWithGoogle()}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-lg text-[14px] font-medium transition-all mb-4 hover:bg-white/5 active:scale-[0.98]"
        style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }}></div>
        <span className="text-[12px] font-medium" style={{ color: 'var(--text2)' }}>OR</span>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }}></div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="font-micro block mb-2" style={{ color: 'var(--text2)' }}>EMAIL</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full text-[14px] px-4 py-3 rounded-lg outline-none transition-all"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent2)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 184, 255, 0.15)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>
        <div>
          <label className="font-micro block mb-2" style={{ color: 'var(--text2)' }}>USERNAME</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="TraderName"
            required
            minLength={3}
            maxLength={30}
            className="w-full text-[14px] px-4 py-3 rounded-lg outline-none transition-all"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent2)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 184, 255, 0.15)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>
        <div>
          <label className="font-micro block mb-2" style={{ color: 'var(--text2)' }}>PASSWORD</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 8 characters"
            required
            minLength={8}
            className="w-full text-[14px] px-4 py-3 rounded-lg outline-none transition-all"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent2)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 184, 255, 0.15)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>
        <div>
          <label className="font-micro block mb-2" style={{ color: 'var(--text2)' }}>CONFIRM PASSWORD</label>
          <input
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            placeholder="Repeat password"
            required
            className="w-full text-[14px] px-4 py-3 rounded-lg outline-none transition-all"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent2)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 184, 255, 0.15)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>
        {error && <p className="text-[13px]" style={{ color: '#ff4a6b' }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg text-[14px] font-semibold transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          style={{ background: 'var(--accent)', color: '#080b0f' }}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
      <p className="mt-6 text-center text-[14px]" style={{ color: 'var(--text2)' }}>
        Already have an account?{' '}
        <Link to="/login" className="font-semibold transition-colors" style={{ color: 'var(--accent)' }}>
          Login
        </Link>
      </p>
    </>
  );
}
