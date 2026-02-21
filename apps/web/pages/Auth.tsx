import React, { useState } from 'react';
import { NeoCard } from '../components/NeoCard';
import { NeoButton } from '../components/NeoButton';
import { Mascot } from '../components/Mascot';
import { View } from '../types';
import { vicoo } from '@vicoo/sdk';

interface AuthProps {
  onLogin: () => void;
}

type AuthMode = 'login' | 'register';

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [mascotState, setMascotState] = useState<'idle' | 'thinking' | 'happy'>('idle');
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    rememberMe: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMascotState('thinking');
    setError(null);

    try {
      if (mode === 'register') {
        // Registration - for now, use dev token
        // In production, this would call a real registration endpoint
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
      }

      // Call the API to get a dev token
      const response = await vicoo.generateDevToken();
      const token = response.data.token;

      // Store token
      localStorage.setItem('authToken', token);
      vicoo.setToken(token);

      // Get user info
      const userResponse = await vicoo.getCurrentUser();
      localStorage.setItem('user', JSON.stringify(userResponse.data));

      setMascotState('happy');
      setTimeout(() => {
        setIsLoading(false);
        onLogin();
      }, 500);
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed');
      setMascotState('idle');
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const switchMode = () => {
    setMode(prev => prev === 'login' ? 'register' : 'login');
    setMascotState('idle');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-light dark:bg-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-dot-pattern opacity-10 dark:opacity-5 pointer-events-none"></div>

      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary rounded-full opacity-20 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-48 h-48 bg-accent rounded-full opacity-20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        {/* Left Side - Welcome / Mascot */}
        <div className="flex flex-col items-center justify-center text-center space-y-6 py-8">
          {/* Logo */}
          <div className="mb-4">
            <h1 className="text-7xl font-display font-black text-ink dark:text-white tracking-tight">
              vicoo
            </h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="w-3 h-3 bg-primary rounded-full animate-pulse"></span>
              <span className="text-sm font-bold text-gray-500 dark:text-gray-400 tracking-widest uppercase">
                Visual Core
              </span>
              <span className="w-3 h-3 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></span>
            </div>
          </div>

          {/* Mascot */}
          <div className="relative">
            <Mascot state={mascotState} className="w-48 h-48" />
            {mascotState === 'idle' && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 border-2 border-ink dark:border-white px-4 py-1 rounded-full shadow-neo-sm">
                <span className="text-xs font-bold text-ink dark:text-white">
                  {mode === 'login' ? 'Welcome back!' : 'Join the squad!'}
                </span>
              </div>
            )}
          </div>

          {/* Tagline */}
          <div className="space-y-2">
            <p className="text-2xl font-bold text-ink dark:text-white">
              {mode === 'login' ? 'Welcome back, genius!' : 'Start your journey!'}
            </p>
            <p className="text-gray-600 dark:text-gray-400 font-medium max-w-sm">
              {mode === 'login'
                ? 'Your second brain awaits. Let\'s pick up where you left off.'
                : 'Join thousands of thinkers organizing their thoughts with AI superpowers.'}
            </p>
          </div>

          {/* Features List */}
          <div className="grid grid-cols-2 gap-4 mt-4 w-full max-w-sm">
            {[
              { icon: 'auto_awesome', text: 'AI-Powered' },
              { icon: 'account_tree', text: 'Neural Garden' },
              { icon: 'bolt', text: 'Vibe Coding' },
              { icon: 'public', text: 'Share Anywhere' }
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-2 bg-white dark:bg-gray-800 border-2 border-ink dark:border-gray-600 rounded-xl px-3 py-2">
                <span className="material-icons-round text-primary text-lg">{feature.icon}</span>
                <span className="text-xs font-bold text-ink dark:text-gray-200">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="flex items-center justify-center">
          <NeoCard className="w-full max-w-md p-8" color="white">
            {/* Form Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-display font-black text-ink dark:text-white mb-2">
                {mode === 'login' ? 'LOG IN' : 'SIGN UP'}
              </h2>
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                </span>
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-sm font-bold text-primary hover:underline"
                >
                  {mode === 'login' ? 'Create one!' : 'Log in'}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border-2 border-red-500 rounded-xl">
                <p className="text-sm font-bold text-red-700 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-bold text-ink dark:text-gray-200 mb-2">
                    USERNAME
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    placeholder="Pick a cool username"
                    className="w-full px-4 py-3 bg-light dark:bg-gray-900 border-2 border-ink dark:border-gray-600 rounded-xl font-bold text-ink dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-0 transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-ink dark:text-gray-200 mb-2">
                  EMAIL
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-light dark:bg-gray-900 border-2 border-ink dark:border-gray-600 rounded-xl font-bold text-ink dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-0 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-ink dark:text-gray-200 mb-2">
                  PASSWORD
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-light dark:bg-gray-900 border-2 border-ink dark:border-gray-600 rounded-xl font-bold text-ink dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-0 transition-colors"
                />
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-bold text-ink dark:text-gray-200 mb-2">
                    CONFIRM PASSWORD
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-light dark:bg-gray-900 border-2 border-ink dark:border-gray-600 rounded-xl font-bold text-ink dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-0 transition-colors"
                  />
                </div>
              )}

              {mode === 'login' && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleInputChange}
                      className="w-5 h-5 accent-primary border-2 border-ink dark:border-gray-600 rounded"
                    />
                    <span className="text-sm font-bold text-ink dark:text-gray-200">Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="text-sm font-bold text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <NeoButton
                type="submit"
                className="w-full py-4 text-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-icons-round animate-spin">sync</span>
                    {mode === 'login' ? 'Logging in...' : 'Creating account...'}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {mode === 'login' ? 'LET\'S GO' : 'GET STARTED'}
                    <span className="material-icons-round">arrow_forward</span>
                  </span>
                )}
              </NeoButton>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 font-bold">OR</span>
                </div>
              </div>

              {/* Social Login */}
              <div className="grid grid-cols-2 gap-4">
                <NeoButton
                  type="button"
                  variant="secondary"
                  className="py-3"
                  onClick={() => {}}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google
                  </span>
                </NeoButton>
                <NeoButton
                  type="button"
                  variant="secondary"
                  className="py-3"
                  onClick={() => {}}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </span>
                </NeoButton>
              </div>
            </form>
          </NeoCard>
        </div>
      </div>
    </div>
  );
};
