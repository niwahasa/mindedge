import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        navigate('/');
      } else {
        setError('Invalid email or password. Try registering first.');
      }
    } catch (err) {
      setError('Login failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="font-display mb-6" style={{ color: 'var(--text)' }}>Welcome Back</h2>
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
        {error && <p className="text-[13px]" style={{ color: '#ff4a6b' }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg text-[14px] font-semibold transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          style={{ background: 'var(--accent)', color: '#080b0f' }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="mt-6 text-center text-[14px]" style={{ color: 'var(--text2)' }}>
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-semibold transition-colors" style={{ color: 'var(--accent)' }}>
          Register
        </Link>
      </p>
    </>
  );
}
