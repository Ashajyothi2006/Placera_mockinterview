import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  Briefcase, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  AlertCircle, 
  KeyRound, 
  ArrowLeft,
  Mic,
  FileText,
  Cpu,
  Activity
} from 'lucide-react';
import api from '../services/api';
import { getDisplayName } from '../utils/userProfile';

const PREVIEW_TABS = [
  { id: 'voice', label: 'Real-Time Voice AI', icon: Mic },
  { id: 'ats', label: 'ATS Score Engine', icon: FileText },
  { id: 'company', label: 'All Engineering...', icon: Cpu },
  { id: 'insights', label: 'Personalized Insights', icon: TrendingUp }
];

const Auth = ({ onLogin }) => {
  const [view, setView] = useState('login'); // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [targetRole, setTargetRole] = useState('Software Developer');
  const [rememberMe, setRememberMe] = useState(true);
  
  // Right panel active tab (default to 'company' as shown in the mockup image)
  const [activeTab, setActiveTab] = useState('company');

  // State for feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [forgotStep, setForgotStep] = useState(1);

  // Quick fill helper for testing/demo
  const handleQuickDemo = (demoType) => {
    setErrorMessage('');
    setSuccessMessage('');
    if (demoType === 'asha') {
      setEmail('ashalathaavuru7@gmail.com');
      setName('Asha Latha');
      setPassword('Asha@2006');
      setTargetRole('Software Developer');
    } else {
      setEmail('candidate@placera.ai');
      setName('Alex Chen');
      setPassword('placeraDemo2026');
      setTargetRole('Senior Full-Stack Engineer');
    }
  };

  // Handle Login submission with real backend verification
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/login', {
        email: email.trim(),
        password
      });

      if (response.data?.success) {
        const user = response.data.user;
        localStorage.setItem('auth', 'true');
        localStorage.setItem('user_id', user.email);
        localStorage.setItem('user_email', user.email);
        
        const friendly = getDisplayName(user.email, user.fullName);
        localStorage.setItem('user_name', friendly.displayName);
        if (user.targetRole) {
          localStorage.setItem('user_target_role', user.targetRole);
        }

        onLogin();
      } else {
        setErrorMessage(response.data?.error || 'Your credentials are incorrect. Please verify your email and password.');
      }
    } catch (err) {
      console.error('Login error:', err);
      const serverErr = err.response?.data?.error;
      setErrorMessage(serverErr || 'Your credentials are incorrect. Please verify your email and password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Registration submission
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/register', {
        email: email.trim(),
        password,
        fullName: name.trim(),
        targetRole: targetRole.trim()
      });

      if (response.data?.success) {
        const user = response.data.user;
        localStorage.setItem('auth', 'true');
        localStorage.setItem('user_id', user.email);
        localStorage.setItem('user_email', user.email);
        
        const friendly = getDisplayName(user.email, user.fullName);
        localStorage.setItem('user_name', friendly.displayName);
        if (user.targetRole) {
          localStorage.setItem('user_target_role', user.targetRole);
        }

        onLogin();
      } else {
        setErrorMessage(response.data?.error || 'Registration could not be completed.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      const serverErr = err.response?.data?.error;
      setErrorMessage(serverErr || 'Registration failed. Please check your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Forgot Password - Step 1: Verify Email
  const handleForgotVerifyEmail = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/forgot-password', {
        email: email.trim()
      });

      if (response.data?.success) {
        setForgotStep(2);
        setSuccessMessage('Account verified. Please enter your new password below.');
      } else {
        setErrorMessage(response.data?.error || 'No registered account found with this email.');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      const serverErr = err.response?.data?.error;
      setErrorMessage(serverErr || 'No registered account found with this email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Forgot Password - Step 2: Set New Password
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-type carefully.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/reset-password', {
        email: email.trim(),
        newPassword
      });

      if (response.data?.success) {
        setView('login');
        setPassword(newPassword);
        setForgotStep(1);
        setNewPassword('');
        setConfirmPassword('');
        setSuccessMessage('Password has been successfully updated! You can now sign in.');
      } else {
        setErrorMessage(response.data?.error || 'Failed to update password.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      const serverErr = err.response?.data?.error;
      setErrorMessage(serverErr || 'Failed to update password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#080D1A] text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* ──────────────── Left Panel: Login / Auth Form ──────────────── */}
      <div className="w-full lg:w-[48%] xl:w-[44%] flex flex-col justify-between p-8 sm:p-12 lg:p-14 relative z-10 bg-[#090E1D] border-r border-slate-800/80">
        
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between mb-8 sm:mb-10">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-950/60 border border-blue-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.35)]">
                <Briefcase className="text-blue-400 w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold tracking-tight text-white">Placera</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    AI V2.4
                  </span>
                </div>
                <span className="block text-xs text-slate-400 mt-0.5">
                  Placement & Career Preparation Platform
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 text-emerald-400 text-xs font-medium shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              AI Systems Online
            </div>
          </div>

          {/* Heading & Subtitle */}
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {view === 'login' && 'Welcome back'}
              {view === 'register' && 'Create your account'}
              {view === 'forgot' && 'Reset your password'}
            </h1>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              {view === 'login' && 'Sign in to access your AI mock interviews, ATS resume diagnostics, and company exam rooms.'}
              {view === 'register' && 'Join top university candidates and professionals training for Tier-1 placements.'}
              {view === 'forgot' && 'Follow the steps below to securely reset your account password.'}
            </p>
          </div>

          {/* Quick Fill For Testing (only on Login view) */}
          {view === 'login' && (
            <div className="mb-6 p-3.5 rounded-xl bg-[#0d1424] border border-slate-800 shadow-inner">
              <div className="flex items-center justify-between text-xs mb-2.5">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Quick Fill For Testing:
                </span>
                <span className="text-[11px] text-slate-500">Click to auto-populate</span>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('asha')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/40 text-blue-300 transition-all text-center truncate"
                >
                  <User size={13} className="text-blue-400" />
                  Asha (Software Developer)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('guest')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 text-slate-300 transition-all text-center truncate"
                >
                  <span className="text-xs">🚀</span>
                  Guest Candidate
                </button>
              </div>
            </div>
          )}

          {/* ❌ Error Message Banner */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-sm flex items-start gap-2.5 shadow-sm">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-200">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* ✅ Success Message Banner */}
          {successMessage && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-sm flex items-start gap-2.5 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-200">{successMessage}</p>
              </div>
            </div>
          )}

          {/* ──────────────── VIEW 1: SIGN IN FORM ──────────────── */}
          {view === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Corporate or Personal Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="ashalathaavuru7@gmail.com"
                    className="w-full pl-10 pr-4 py-3 bg-[#0d1424] border border-slate-700/70 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setView('forgot');
                      setErrorMessage('');
                      setSuccessMessage('');
                      setForgotStep(1);
                    }}
                    className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-11 py-3 bg-[#0d1424] border border-slate-700/70 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <span className="text-xs text-slate-400">Keep me signed in on this computer</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-3 py-3.5 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] shadow-[0_0_25px_rgba(37,99,235,0.4)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all flex items-center justify-center gap-2 group disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Enterprise Workspace</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ──────────────── VIEW 2: REGISTER FORM ──────────────── */}
          {view === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Asha Latha"
                    className="w-full pl-10 pr-4 py-3 bg-[#0d1424] border border-slate-700/70 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Target Job Role
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <TrendingUp size={16} />
                  </div>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    required
                    placeholder="e.g. Software Developer, Data Scientist"
                    className="w-full pl-10 pr-4 py-3 bg-[#0d1424] border border-slate-700/70 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Corporate or Personal Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="candidate@placera.ai"
                    className="w-full pl-10 pr-4 py-3 bg-[#0d1424] border border-slate-700/70 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Password (minimum 6 characters)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-11 py-3 bg-[#0d1424] border border-slate-700/70 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-3 py-3.5 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] shadow-[0_0_25px_rgba(37,99,235,0.4)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all flex items-center justify-center gap-2 group disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Enterprise Account</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ──────────────── VIEW 3: FORGOT PASSWORD ──────────────── */}
          {view === 'forgot' && (
            <div>
              {forgotStep === 1 ? (
                <form onSubmit={handleForgotVerifyEmail} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail size={16} />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="ashalathaavuru7@gmail.com"
                        className="w-full pl-10 pr-4 py-3 bg-[#0d1424] border border-slate-700/70 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 py-3.5 px-4 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.99] shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Verify Email & Proceed</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-500/30 text-xs text-blue-300">
                    Resetting password for: <strong>{email}</strong>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      New Password (minimum 6 characters)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <KeyRound size={16} />
                      </div>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="New password"
                        className="w-full pl-10 pr-4 py-3 bg-[#0d1424] border border-slate-700/70 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock size={16} />
                      </div>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Re-type new password"
                        className="w-full pl-10 pr-4 py-3 bg-[#0d1424] border border-slate-700/70 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 py-3.5 px-4 rounded-xl font-semibold text-sm text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Update Password & Sign In</span>
                        <CheckCircle2 size={16} />
                      </>
                    )}
                  </button>
                </form>
              )}

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setErrorMessage('');
                    setSuccessMessage('');
                    setForgotStep(1);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft size={14} />
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* Switch Prompt */}
          {view !== 'forgot' && (
            <div className="mt-8 text-center text-xs text-slate-400">
              {view === 'login' ? (
                <>
                  New to Placera?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setView('register');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Create free account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setView('login');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Sign in here
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-10 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Supabase Verified Auth</span>
          </div>
          <span>Placera AI Core v2.4</span>
        </div>
      </div>

      {/* ──────────────── Right Panel: Interactive Showcase ──────────────── */}
      <div className="w-full lg:w-[52%] xl:w-[56%] flex flex-col justify-between p-8 sm:p-12 lg:p-14 bg-gradient-to-br from-[#070b16] via-[#090e1c] to-[#05070e] relative overflow-hidden border-l border-slate-800/40">
        
        {/* Ambient Glows & Grid */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/15 blur-[140px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-[140px] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-35"></div>

        <div className="relative z-10">
          {/* Top Badges Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-amber-500/30 text-amber-300 text-xs font-medium shadow-sm">
              <Sparkles size={13} className="text-amber-400" />
              Next-Gen Campus & Corporate Placement Suite
            </div>
            <div className="inline-flex items-center gap-1.5 text-blue-400 text-xs font-medium">
              <ShieldCheck size={14} className="text-blue-400" />
              Used across 20+ Tier-1 Company Formats
            </div>
          </div>

          {/* Hero Heading & Subtitle */}
          <div className="mb-6">
            <span className="block text-[11px] font-bold tracking-widest text-cyan-400 uppercase mb-2">
              Enterprise Career Intelligence
            </span>
            <h2 className="text-3xl sm:text-4xl xl:text-[42px] font-extrabold text-white tracking-tight leading-tight">
              Master Technical Interviews & <br />
              Crack Top Engineering Offers.
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-3 max-w-xl leading-relaxed">
              Placera integrates multimodal voice synthesis, ATS resume parsing, and verified company-pattern test suites to turn preparation into guaranteed readiness.
            </p>
          </div>

          {/* 4 Feature Tabs Bar */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 p-1.5 rounded-xl bg-slate-900/80 border border-slate-800/80 mb-6">
            {PREVIEW_TABS.map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all truncate whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-800 border border-blue-500/50 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <IconComp size={14} className={isActive ? 'text-blue-400 shrink-0' : 'text-slate-400 shrink-0'} />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* ──────────────── Interactive Feature Card ──────────────── */}
          
          {/* TAB 3: Company-Specific Skill Assessments (Exact Match to User Image!) */}
          {activeTab === 'company' && (
            <div className="rounded-2xl bg-[#0c1322]/90 border border-slate-800 p-5 sm:p-6 shadow-2xl relative">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 mt-0.5">
                    <Cpu size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Company-Specific Skill Assessments</h3>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed max-w-lg">
                      20+ questions per test matching authentic company recruitment patterns for TCS, Google, Texas Instruments (ECE), Siemens (EEE), L&T (Civil), and Tata Motors (Mech).
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold uppercase tracking-wider shrink-0">
                  Active Engine
                </span>
              </div>

              {/* Sub-Panel: Supported Company Formats */}
              <div className="p-4 rounded-xl bg-[#080d1a] border border-slate-800/90 mt-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3 text-xs">
                  <span className="text-slate-300 font-semibold">Supported Company Formats (20+ Qs/Test)</span>
                  <span className="text-purple-400 font-medium">100% Step Solutions</span>
                </div>

                {/* Grid of Company Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-[#0d1424] border border-slate-800/80">
                    <div className="font-bold text-white text-xs truncate">Texas Instruments</div>
                    <div className="flex items-center justify-between mt-1 text-[11px]">
                      <span className="text-blue-400 font-medium">ECE</span>
                      <span className="text-slate-400">20 Qs</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0d1424] border border-slate-800/80">
                    <div className="font-bold text-white text-xs truncate">Siemens</div>
                    <div className="flex items-center justify-between mt-1 text-[11px]">
                      <span className="text-blue-400 font-medium">EEE</span>
                      <span className="text-slate-400">20 Qs</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0d1424] border border-slate-800/80">
                    <div className="font-bold text-white text-xs truncate">Google</div>
                    <div className="flex items-center justify-between mt-1 text-[11px]">
                      <span className="text-blue-400 font-medium">CS</span>
                      <span className="text-slate-400">Coding • MCQ</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0d1424] border border-slate-800/80">
                    <div className="font-bold text-white text-xs truncate">L&T Construction</div>
                    <div className="flex items-center justify-between mt-1 text-[11px]">
                      <span className="text-blue-400 font-medium">Civil</span>
                      <span className="text-slate-400">20 Qs</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0d1424] border border-slate-800/80">
                    <div className="font-bold text-white text-xs truncate">Tata Motors</div>
                    <div className="flex items-center justify-between mt-1 text-[11px]">
                      <span className="text-blue-400 font-medium">Mech</span>
                      <span className="text-slate-400">20 Qs</span>
                    </div>
                  </div>
                </div>

                {/* Footer Timer Note */}
                <div className="text-center text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-800/60">
                  Authoritative 60s/Q Timer • Step by Step Solutions
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: Real-Time Voice AI Preview */}
          {activeTab === 'voice' && (
            <div className="rounded-2xl bg-[#0c1322]/90 border border-slate-800 p-5 sm:p-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                    <Mic size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Adaptive Voice Mock Interview</h3>
                    <p className="text-xs text-blue-400 font-medium">Real-Time Gemini 3.8 Follow-Up Engine</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                  <Activity size={12} className="animate-pulse" />
                  Live Audio Session
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#080d1a] border border-slate-800 mb-4">
                <p className="text-xs text-slate-300 italic mb-3">
                  "Since you selected Redis for caching, how would you prevent cache stampede when thousands of worker threads hit an expired key simultaneously?"
                </p>
                <div className="flex items-center justify-between gap-1 h-8 px-2 bg-[#0d1424] rounded-lg">
                  {[25, 45, 75, 30, 90, 60, 40, 85, 70, 50, 95, 65, 35, 80, 55, 90, 45, 60, 85, 30, 65, 40].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-blue-600 to-cyan-400 rounded-full"
                      style={{ height: `${h}%`, opacity: 0.7 }}
                    ></div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-[#0d1424] border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Speech Clarity</span>
                  <span className="font-bold text-emerald-400 text-sm">9.4 / 10</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0d1424] border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Technical Accuracy</span>
                  <span className="font-bold text-blue-400 text-sm">94%</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0d1424] border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Eye Contact</span>
                  <span className="font-bold text-cyan-400 text-sm">96%</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ATS Score Engine Preview */}
          {activeTab === 'ats' && (
            <div className="rounded-2xl bg-[#0c1322]/90 border border-slate-800 p-5 sm:p-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">ATS Resume Intelligence</h3>
                    <p className="text-xs text-blue-400 font-medium">Enterprise Parser & Role Alignment</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-blue-950/80 border border-blue-500/40 text-blue-300 text-xs font-bold">
                  Score: 98 / 100
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#080d1a] border border-slate-800">
                <span className="text-xs text-slate-400 block mb-2 font-medium">Top High-Yield Keywords Matched:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['React 19', 'FastAPI', 'Distributed Systems', 'PostgreSQL', 'Docker', 'System Design', 'CI/CD', 'Kafka'].map((kw) => (
                    <span key={kw} className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] font-medium flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-blue-400" />
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Personalized Insights Preview */}
          {activeTab === 'insights' && (
            <div className="rounded-2xl bg-[#0c1322]/90 border border-slate-800 p-5 sm:p-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Placement Readiness Analytics</h3>
                    <p className="text-xs text-cyan-400 font-medium">Tier-1 Company Benchmark</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                  Ready for Loop
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#080d1a] border border-slate-800">
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "Candidate has demonstrated top 5% system architecture and concurrency knowledge. Recommended for final Google L5 & Amazon SDE II loops."
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Social Proof */}
        <div className="relative z-10 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <span>Trusted by 10,000+ candidates from premier engineering colleges</span>
          <span className="font-semibold text-slate-400">Google • Microsoft • Amazon • Siemens</span>
        </div>

      </div>

    </div>
  );
};

export default Auth;
