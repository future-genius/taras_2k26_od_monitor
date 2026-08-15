import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { KeyRound, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export const ChangePassword: React.FC = () => {
  const navigate = useNavigate();
  const { user, completePasswordChange } = useAuth();
  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!user?.registerNumber) {
      setError('Session error. Please log in again.');
      return;
    }

    setIsLoading(true);

    // Verify current password
    const account = apiService.verifyLogin(user.registerNumber, currentPassword);
    if (!account) {
      setError('Current password is incorrect.');
      setIsLoading(false);
      return;
    }

    const success = apiService.changePassword(user.registerNumber, newPassword);
    setIsLoading(false);

    if (success) {
      showToast('Password changed successfully!', 'success');
      completePasswordChange();
      navigate('/dashboard');
    } else {
      setError('Failed to change password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-taras-950 flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-md bg-taras-900 border border-taras-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-taras-800 bg-gradient-to-b from-taras-800/40 to-taras-900 text-center">
          <div className="w-12 h-12 bg-amber-600 rounded-xl mx-auto flex items-center justify-center mb-3">
            <KeyRound className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-lg font-bold text-white">Change Your Password</h2>
          <p className="text-xs text-taras-400 mt-1">
            This is your first login. Please set a new secure password to continue.
          </p>
        </div>

        <div className="p-8 space-y-5">
          {error && (
            <div className="p-3 bg-rose-950 border border-rose-800 text-rose-300 text-xs rounded-lg font-medium">
              {error}
            </div>
          )}

          <div className="p-3 bg-amber-950/60 border border-amber-800/50 rounded-lg text-xs text-amber-300 space-y-1">
            <p className="font-semibold">Password Format Reminder:</p>
            <p>Your initial (temporary) password is your Date of Birth in <strong>DDMMYYYY</strong> format.</p>
            <p>Example: If your DOB is 12 May 2005, your initial password is <strong>12052005</strong></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Current Password (DOB as DDMMYYYY)</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="e.g. 12052005"
                className="w-full px-4 py-2.5 rounded-lg bg-taras-950 border border-taras-800 text-white text-sm focus:outline-none focus:border-taras-accent"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-4 py-2.5 pr-10 rounded-lg bg-taras-950 border border-taras-800 text-white text-sm focus:outline-none focus:border-taras-accent"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-taras-500 hover:text-taras-300">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-4 py-2.5 pr-10 rounded-lg bg-taras-950 border border-taras-800 text-white text-sm focus:outline-none focus:border-taras-accent"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-taras-500 hover:text-taras-300">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-taras-accent hover:bg-taras-accent-hover text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isLoading ? 'Saving...' : 'Set New Password'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
