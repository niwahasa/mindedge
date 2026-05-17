import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { LayoutDashboard, ClipboardList, Brain, BarChart3, Sparkles, Settings as SettingsIcon, Plus, Zap, LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useSession, useGreeting } from '@/hooks';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/trades', label: 'Trade Log', icon: ClipboardList },
  { path: '/psychology', label: 'Psychology', icon: Brain },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/coach', label: 'AI Coach', icon: Sparkles },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const greeting = useGreeting();
  const session = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[200px_1fr]" style={{ background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[200px] flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
      >
        {/* Logo */}
        <div className="p-5 pb-3">
          <div className="flex items-center gap-1">
            <span className="text-[18px] font-bold" style={{ fontFamily: 'Syne', color: 'var(--text)' }}>Mind</span>
            <Zap className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <span className="text-[18px] font-bold" style={{ fontFamily: 'Syne', color: 'var(--accent)' }}>Edge</span>
          </div>
          <p className="font-micro mt-1" style={{ color: 'var(--text3)' }}>DISCIPLINE. DATA. EDGE.</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-all duration-150 w-full"
                style={{
                  background: isActive ? 'var(--surface2)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text2)',
                  borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--surface-hover)';
                    e.currentTarget.style.color = 'var(--text)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text2)';
                  }
                }}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-card-title text-[15px]">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Mini Card */}
        <div className="p-3 m-3 rounded-lg" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            {user?.profilePic ? (
              <img
                src={user.profilePic}
                alt="Profile Avatar"
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                style={{ border: '1px solid var(--border)' }}
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0"
                style={{ background: 'rgba(0, 184, 255, 0.15)', color: 'var(--accent2)' }}
              >
                {user?.username?.slice(0, 2).toUpperCase() || 'ME'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate" style={{ color: 'var(--text)' }}>{user?.username}</p>
              <div className="flex items-center gap-2">
                <span
                  className="font-micro inline-block mt-0.5 px-1.5 py-0.5 rounded"
                  style={{ 
                    background: user?.plan === 'premium' ? 'rgba(0, 229, 160, 0.15)' : 'rgba(148, 163, 184, 0.15)', 
                    color: user?.plan === 'premium' ? 'var(--accent)' : 'var(--text3)' 
                  }}
                >
                  {user?.plan?.toUpperCase() || 'FREE'}
                </span>
                {user?.plan === 'free' && (
                  <button 
                    onClick={() => navigate('/membership')}
                    className="text-[10px] font-bold text-accent hover:underline mt-0.5"
                  >
                    UPGRADE
                  </button>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 mt-3 text-[12px] transition-colors w-full"
            style={{ color: 'var(--text3)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--red)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text3)'; }}
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex flex-col min-h-screen overflow-hidden">
        {/* Top Bar */}
        <header
          className="flex items-center justify-between px-6 lg:px-8 h-16 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-4">
            {/* Mobile menu toggle */}
            <button
              className="lg:hidden p-1.5 rounded-lg"
              style={{ color: 'var(--text2)' }}
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-section text-[14px] sm:text-[18px] lg:text-[20px] truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none" style={{ color: 'var(--text)' }} title={`Good ${greeting}, ${user?.username}`}>
                Good {greeting}, {user?.username} <span className="text-[12px] sm:text-[16px]">⚡</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Session Indicator */}
            <div
              className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border2)' }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse-dot flex-shrink-0"
                style={{ background: session.color }}
              />
              <span className="font-micro" style={{ color: 'var(--text2)' }}>{session.name}</span>
            </div>

            {/* Log Trade Button */}
            <button
              onClick={() => navigate('/trades?action=new')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[14px] font-semibold transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
              style={{ background: 'var(--accent)', color: '#080b0f' }}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Log Trade</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
