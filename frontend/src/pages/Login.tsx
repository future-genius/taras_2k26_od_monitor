import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogIn, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginAsPresident } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter your credentials.');
      return;
    }
    setIsLoading(true);
    setError('');
    const result = await login(username.trim(), password.trim());
    setIsLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Invalid credentials. Please try again.');
    }
  };

  const handlePresidentLogin = () => {
    loginAsPresident();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-taras-950 flex flex-col justify-center items-center p-4 font-sans text-slate-100">
      <div className="w-full max-w-md bg-taras-900 border border-taras-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-taras-800 text-center bg-gradient-to-b from-taras-800/50 to-taras-900">
          <div className="w-14 h-14 bg-taras-accent rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg mb-3">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">TARAS</h1>
          <p className="text-xs text-taras-300 font-medium uppercase tracking-widest mt-1">
            ECE Student Monitoring System
          </p>
          <p className="text-[10px] text-taras-500 mt-2">
            Electronics &amp; Communication Engineering
          </p>
        </div>

        {/* Login Form */}
        <div className="p-8 space-y-5">
          {error && (
            <div className="p-3 bg-rose-950 border border-rose-800 text-rose-300 text-xs rounded-lg font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-300 font-semibold text-xs mb-1.5">
                Register Number / Email
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. 24ECE001 or president@taras.edu"
                className="w-full px-4 py-2.5 rounded-lg bg-taras-950 border border-taras-800 text-white text-sm focus:outline-none focus:border-taras-accent transition-colors"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold text-xs mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="DOB as DDMMYYYY (e.g. 12052005) or your password"
                  className="w-full px-4 py-2.5 pr-10 rounded-lg bg-taras-950 border border-taras-800 text-white text-sm focus:outline-none focus:border-taras-accent transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-taras-500 hover:text-taras-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-taras-500 mt-1.5">
                First-time students: use your Date of Birth as DDMMYYYY (e.g. 12052005)
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-taras-accent hover:bg-taras-accent-hover text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'Signing in...' : 'Login'}</span>
            </button>
          </form>

          {/* President Quick Access (Demo) */}
          <div className="pt-4 border-t border-taras-800">
            <button
              onClick={handlePresidentLogin}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800/50 text-emerald-300 text-xs font-medium hover:bg-emerald-900/50 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Quick Access — Login as President</span>
            </button>
            <p className="text-center text-[10px] text-taras-600 mt-2">
              For demo purposes only. Remove in production.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
