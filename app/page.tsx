'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp, CloudFile, BillingLog } from '@/lib/context';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cloud,
  Upload,
  Shield,
  Key,
  FileText,
  Database,
  LogOut,
  Sun,
  Moon,
  Lock,
  User,
  Globe,
  Phone,
  RefreshCw,
  Search,
  Copy,
  Check,
  Eye,
  EyeOff,
  Activity,
  File,
  HardDrive,
  CircleAlert,
  DollarSign,
  Clock,
  Terminal,
  ExternalLink
} from 'lucide-react';

export default function Home() {
  const {
    theme,
    toggleTheme,
    user,
    authLoading,
    uploadLoading,
    listLoading,
    keyLoading,
    logsLoading,
    files,
    apiKey,
    billingLogs,
    alerts,
    addAlert,
    removeAlert,
    signUp,
    logIn,
    logOut,
    uploadFile,
    fetchFiles,
    generateApiKey,
    fetchBillingLogs
  } = useApp();

  // Navigation states
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'billing' | 'profile'>('overview');
  
  // Auth state: 'login' | 'signup'
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  // Sign up fields
  const [signupName, setSignupName] = useState('');
  const [signupMobile, setSignupMobile] = useState('');
  const [signupCountry, setSignupCountry] = useState('United States');
  const [signupPassword, setSignupPassword] = useState('');
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  
  // File upload drag-and-drop
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Auto load data when user logs in
  useEffect(() => {
    if (user) {
      fetchFiles();
      fetchBillingLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Handle Drag Events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle Drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      await uploadFile(droppedFile);
    }
  };

  // Handle File Input Selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0]);
    }
  };

  // Clipboard copy helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addAlert(`${label} copied to clipboard!`, 'success');
  };

  // Submit Sign Up
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupMobile || !signupCountry || !signupPassword) {
      addAlert('All registration fields are required.', 'error');
      return;
    }
    const success = await signUp({
      name: signupName,
      mobile: signupMobile,
      country: signupCountry,
      password: signupPassword,
    });
    if (success) {
      // Auto-set the generated login email
      setLoginEmail(`${signupMobile}+@mtos-org.com`);
      setAuthMode('login');
      // Reset signup fields
      setSignupName('');
      setSignupMobile('');
      setSignupPassword('');
    }
  };

  // Submit Log In
  const handleLogInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      addAlert('Email and password are required to login.', 'error');
      return;
    }
    await logIn({
      email: loginEmail,
      password: loginPassword,
    });
  };

  // Format file size
  const formatBytes = (bytes?: number) => {
    if (bytes === undefined || bytes === null) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filtered files
  const filteredFiles = files.filter(f => 
    (f.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col antialiased">
      {/* Toast Alert Notifications */}
      <div id="toast-container" className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.2 }}
              className={`p-4 rounded-xl shadow-lg border backdrop-blur-md pointer-events-auto flex items-start gap-3 ${
                alert.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : alert.type === 'error'
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                  : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
              }`}
            >
              <div className="mt-0.5">
                <CircleAlert className="h-5 w-5 shrink-0" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium leading-relaxed font-sans">{alert.text}</p>
              </div>
              <button
                onClick={() => removeAlert(alert.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0"
              >
                &times;
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Container */}
      {!user ? (
        // Unauthenticated Gateway Portal
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-150">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg overflow-hidden"
          >
            {/* Header Identity */}
            <div className="p-6 text-center border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40">
              <div className="mx-auto h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-900/20 mb-3">
                <Cloud className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-sans">
                MTOS Cloud Console
              </h1>
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 leading-normal max-w-sm mx-auto">
                Manage high-performance secure sandbox environments, storage indexes, and billing API credentials.
              </p>
            </div>

            {/* Auth Switcher */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800 p-1 bg-zinc-100/50 dark:bg-zinc-950">
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  authMode === 'login'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs border border-zinc-200/50 dark:border-zinc-700/50'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  authMode === 'signup'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs border border-zinc-200/50 dark:border-zinc-700/50'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Form Section */}
            <div className="p-6">
              {authMode === 'signup' ? (
                // SIGN UP FORM
                <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                      <input
                        type="tel"
                        required
                        placeholder="9876543210"
                        value={signupMobile}
                        onChange={(e) => setSignupMobile(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-9 pr-4 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-zinc-900 dark:text-zinc-100 font-mono"
                      />
                    </div>
                    {signupMobile && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1.5 text-[11px] text-blue-500 dark:text-blue-400 font-mono flex items-center gap-1.5 bg-blue-500/5 p-2 rounded-md border border-blue-500/10"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        ID: <span className="font-semibold">{signupMobile}+@mtos-org.com</span>
                      </motion.p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                      Country
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                      <select
                        value={signupCountry}
                        onChange={(e) => setSignupCountry(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-zinc-900 dark:text-zinc-100 appearance-none"
                      >
                        <option value="United States">United States</option>
                        <option value="India">India</option>
                        <option value="Germany">Germany</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Singapore">Singapore</option>
                        <option value="Australia">Australia</option>
                        <option value="Canada">Canada</option>
                        <option value="Japan">Japan</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                      Secret Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="w-full pl-9 pr-9 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full mt-2 py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-70 disabled:pointer-events-none cursor-pointer"
                  >
                    {authLoading ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <User className="h-3.5 w-3.5" />
                    )}
                    Register Vault Console
                  </button>
                </form>
              ) : (
                // LOG IN FORM
                <form onSubmit={handleLogInSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                      Masked Identity (Email / Mobile @)
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                      <input
                        type="email"
                        required
                        placeholder="9876543210+@mtos-org.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-zinc-900 dark:text-zinc-100 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                      Console Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full pl-9 pr-9 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full mt-2 py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-70 disabled:pointer-events-none cursor-pointer"
                  >
                    {authLoading ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Lock className="h-3.5 w-3.5" />
                    )}
                    Decrypt & Authenticate
                  </button>
                </form>
              )}
            </div>
            
            {/* Dark Mode toggle at bottom of Login */}
            <div className="px-6 pb-6 text-center">
              <button 
                onClick={toggleTheme} 
                className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 py-1 px-2.5 rounded-md cursor-pointer"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="h-3 w-3 text-amber-500" />
                    <span>Light Mode Accessibility</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-3 w-3 text-blue-500" />
                    <span>Dark Mode Accessibility</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      ) : (
        // Authenticated Operations Dashboard Shell
        <div className="flex-1 flex flex-col md:flex-row bg-zinc-50 dark:bg-zinc-950 transition-colors duration-150">
          
          {/* Side Control Rail (Responsive Navigation) */}
          <aside className="w-full md:w-64 bg-zinc-100 dark:bg-zinc-900 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-between shrink-0">
            <div>
              {/* Profile Bar */}
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/30 dark:bg-zinc-950">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shadow-lg shadow-blue-900/20 text-white font-bold text-sm shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate font-mono leading-none mt-0.5">{user.email}</p>
                  </div>
                </div>
                
                {/* Micro Metadata Indicator */}
                <div className="mt-2.5 flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-950 p-1.5 rounded-md border border-zinc-200 dark:border-zinc-800/60">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-zinc-500 dark:text-zinc-400 font-mono">Region: {user.country}</span>
                </div>
              </div>

              {/* Navigation Actions */}
              <nav className="p-3 space-y-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-semibold border-l-2 transition-all cursor-pointer ${
                    activeTab === 'overview'
                      ? 'bg-zinc-200 dark:bg-zinc-850 text-blue-600 dark:text-blue-400 border-blue-500 shadow-xs'
                      : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <Activity className="h-3.5 w-3.5" />
                  Overview Console
                </button>
                <button
                  onClick={() => setActiveTab('files')}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-semibold border-l-2 transition-all cursor-pointer ${
                    activeTab === 'files'
                      ? 'bg-zinc-200 dark:bg-zinc-850 text-blue-600 dark:text-blue-400 border-blue-500 shadow-xs'
                      : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <Database className="h-3.5 w-3.5" />
                  Sandbox Storage
                </button>
                <button
                  onClick={() => setActiveTab('billing')}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-semibold border-l-2 transition-all cursor-pointer ${
                    activeTab === 'billing'
                      ? 'bg-zinc-200 dark:bg-zinc-850 text-blue-600 dark:text-blue-400 border-blue-500 shadow-xs'
                      : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <Key className="h-3.5 w-3.5" />
                  Billing & API Keys
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-semibold border-l-2 transition-all cursor-pointer ${
                    activeTab === 'profile'
                      ? 'bg-zinc-200 dark:bg-zinc-850 text-blue-600 dark:text-blue-400 border-blue-500 shadow-xs'
                      : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  Developer Token
                </button>
              </nav>
            </div>

            {/* Bottom Panel (Theme & Session management) */}
            <div className="mt-auto p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-100/30 dark:bg-zinc-900/40 space-y-2">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors shadow-xs cursor-pointer"
              >
                <span className="text-zinc-500 dark:text-zinc-400">Appearance</span>
                {theme === 'dark' ? (
                  <span className="flex items-center gap-1 text-amber-400">
                    <Sun className="h-3 w-3" /> Light
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-blue-500">
                    <Moon className="h-3 w-3" /> Dark
                  </span>
                )}
              </button>

              {/* Logout button */}
              <button
                onClick={logOut}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/15 rounded-md text-[11px] font-bold text-rose-500 transition-all active:scale-[0.98] cursor-pointer"
              >
                <LogOut className="h-3 w-3" />
                Terminate Session
              </button>
            </div>
          </aside>

          {/* Core Content Area */}
          <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-zinc-50 dark:bg-zinc-950">
            
            {/* Top Dashboard Rail Header */}
            <header className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 font-mono">
                  Cloud Management Shell
                </span>
                <h1 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 capitalize">
                  {activeTab === 'overview' ? 'Operational Health Overview' : activeTab === 'files' ? 'Sandbox File Explorer' : activeTab === 'billing' ? 'Billing Operations & API Keygen' : 'Active JWT Token Session'}
                </h1>
              </div>

              {/* Status Center */}
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 bg-zinc-100/50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 py-1 px-2.5 rounded-md text-[10px] uppercase tracking-widest font-bold text-zinc-600 dark:text-zinc-400">
                  <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />
                  <span>Cloud Gateway: Connected</span>
                </div>
                <div className="flex items-center gap-1.5 bg-zinc-100/50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 py-1 px-2.5 rounded-md text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400">
                  <span>API Status: 200 OK</span>
                </div>
              </div>
            </header>

            {/* Dynamic Content Panel */}
            <div className="p-6 max-w-7xl w-full mx-auto space-y-5 text-zinc-900 dark:text-zinc-200">
              
              {activeTab === 'overview' && (
                // OVERVIEW TAB
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Stats Bento Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* Stat Card 1 */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-start justify-between shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors duration-150">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-sans mb-1">
                          Allocated Sandbox Files
                        </p>
                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white font-mono leading-none py-1">
                          {listLoading ? (
                            <RefreshCw className="h-5 w-5 animate-spin text-zinc-400" />
                          ) : (
                            files.length
                          )}
                        </h3>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Total stored entities</p>
                      </div>
                      <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-blue-500 rounded flex items-center justify-center shrink-0 shadow-xs">
                        <HardDrive className="h-4 w-4" />
                      </div>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-start justify-between shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors duration-150">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-sans mb-1">
                          Billing API Key
                        </p>
                        <div className="h-8 flex items-center py-1">
                          {apiKey ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-mono font-bold uppercase tracking-wide">
                              <Check className="h-2.5 w-2.5" /> Active Bind
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-semibold">
                              Unallocated Key
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Security hash string</p>
                      </div>
                      <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-blue-500 rounded flex items-center justify-center shrink-0 shadow-xs">
                        <Key className="h-4 w-4" />
                      </div>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-start justify-between shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors duration-150">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-sans mb-1">
                          Accumulated Transactions
                        </p>
                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white font-mono leading-none py-1">
                          {logsLoading ? (
                            <RefreshCw className="h-5 w-5 animate-spin text-zinc-400" />
                          ) : (
                            billingLogs.length
                          )}
                        </h3>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Billing operations tracked</p>
                      </div>
                      <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-blue-500 rounded flex items-center justify-center shrink-0 shadow-xs">
                        <FileText className="h-4 w-4" />
                      </div>
                    </div>

                    {/* Stat Card 4 */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-start justify-between shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors duration-150">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-sans mb-1">
                          Estimated Cost Ratio
                        </p>
                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-white font-mono leading-none py-1">
                          $0.00
                        </h3>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Active server bandwidth cost</p>
                      </div>
                      <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-blue-500 rounded flex items-center justify-center shrink-0 shadow-xs">
                        <DollarSign className="h-4 w-4" />
                      </div>
                    </div>

                  </div>

                  {/* System Greeting Card */}
                  <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 border-l-4 border-l-blue-600 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
                    <div className="space-y-1">
                      <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                        Hello, {user.name}!
                      </h2>
                      <p className="text-zinc-600 dark:text-zinc-400 text-xs max-w-2xl leading-relaxed">
                        Your custom cloud environment is fully responsive and connected. Easily manage secure sandboxed file uploads and configure developer integrations instantly.
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setActiveTab('files')}
                        className="py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-md text-xs shadow-xs transition-colors active:scale-[0.98] cursor-pointer"
                      >
                        Launch Storage
                      </button>
                      <button
                        onClick={() => setActiveTab('billing')}
                        className="py-1.5 px-3 bg-zinc-100 dark:bg-zinc-850 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold rounded-md text-xs border border-zinc-200 dark:border-zinc-700 transition-colors active:scale-[0.98] cursor-pointer"
                      >
                        Access API Center
                      </button>
                    </div>
                  </div>

                  {/* Quick-Stats Logs & Details split view */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Left Column: Recent Activity Logs */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs lg:col-span-2">
                      <div className="flex items-center justify-between pb-2.5 border-b border-zinc-200 dark:border-zinc-800/80 mb-3">
                        <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-blue-500" /> Recent Cloud Operations
                        </h4>
                        <button
                          onClick={fetchBillingLogs}
                          className="text-[10px] text-blue-500 hover:text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <RefreshCw className={`h-3 w-3 ${logsLoading ? 'animate-spin' : ''}`} /> Refresh
                        </button>
                      </div>

                      {logsLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center text-zinc-400 gap-2">
                          <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
                          <span className="text-xs font-medium">Fetching transaction ledger...</span>
                        </div>
                      ) : billingLogs.length === 0 ? (
                        <div className="py-12 text-center text-zinc-400 text-xs">
                          No recent transactions recorded on this cloud node.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {billingLogs.slice(0, 4).map((log, index) => (
                            <div
                              key={log.id || index}
                              className="p-2.5 bg-zinc-50 dark:bg-zinc-950/50 rounded-lg border border-zinc-200 dark:border-zinc-800/60 flex items-center justify-between text-[11px] hover:bg-zinc-100/55 dark:hover:bg-zinc-800/20 transition-all"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-blue-500 rounded-md shrink-0 shadow-xs">
                                  <Terminal className="h-3.5 w-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-zinc-700 dark:text-zinc-300 truncate font-mono">
                                    {log.action || 'Unknown Operation'}
                                  </p>
                                  <p className="text-[10px] text-zinc-400 font-mono">
                                    {log.timestamp || 'N/A'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 text-[9px] border border-emerald-500/20 rounded-full uppercase tracking-wider font-bold">
                                  SUCCESS
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right Column: Node Connection Metadata */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs">
                      <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 pb-2.5 border-b border-zinc-200 dark:border-zinc-800/80 mb-3">
                        <Terminal className="h-3.5 w-3.5 text-blue-500" /> Sandbox Node Specs
                      </h4>
                      <div className="space-y-2.5 text-xs font-mono">
                        <div className="flex justify-between py-1.5 border-b border-zinc-200 dark:border-zinc-800/40 text-[11px]">
                          <span className="text-zinc-500 dark:text-zinc-400">Container Root</span>
                          <span className="text-zinc-800 dark:text-zinc-200">/storage/users/</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-zinc-200 dark:border-zinc-800/40 text-[11px]">
                          <span className="text-zinc-500 dark:text-zinc-400">Sandbox Shell</span>
                          <span className="text-zinc-800 dark:text-zinc-200">Linux container</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-zinc-200 dark:border-zinc-800/40 text-[11px]">
                          <span className="text-zinc-500 dark:text-zinc-400">Gateway Port</span>
                          <span className="text-zinc-800 dark:text-zinc-200">443 TLS Secure</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-zinc-200 dark:border-zinc-800/40 text-[11px]">
                          <span className="text-zinc-500 dark:text-zinc-400">JWT Cipher</span>
                          <span className="text-zinc-800 dark:text-zinc-200 font-sans truncate max-w-[120px]">RS256 algorithm</span>
                        </div>
                        <div className="flex justify-between py-1.5 text-[11px]">
                          <span className="text-zinc-500 dark:text-zinc-400">IP Host</span>
                          <span className="text-zinc-800 dark:text-zinc-200">api.cloud.mtos-org.site</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'files' && (
                // FILES STORAGE TAB
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">
                      Upload Files to Cloud Sandbox
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                      Select or drop files to write directly into your dedicated and isolated partition: <code className="bg-zinc-100 dark:bg-zinc-950 px-1.5 py-0.5 rounded text-[11px] font-mono">/storage/users/{"{id}"}/</code>
                    </p>

                    {/* Drag & Drop Zone */}
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                        dragActive
                          ? 'border-blue-500 bg-blue-500/5'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-blue-500/55 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20'
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-transform duration-200 ${
                        uploadLoading ? 'bg-blue-500/10 text-blue-500 animate-pulse' : 'bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 text-zinc-400'
                      }`}>
                        <Upload className={`h-5 w-5 ${uploadLoading ? 'animate-bounce' : ''}`} />
                      </div>
                      
                      {uploadLoading ? (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Writing byte arrays safely...</p>
                          <p className="text-[10px] text-zinc-400">Creating chunked sandbox streams</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                            Drag & Drop File Here, or <span className="text-blue-500 hover:underline">Browse Storage</span>
                          </p>
                          <p className="text-[10px] text-zinc-400">
                            Supports binary, images, pdf, logs, and datasets up to 50MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sandbox File Index list */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs overflow-hidden">
                    {/* Header Controls */}
                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-zinc-100/20 dark:bg-zinc-900/40">
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <Database className="h-3.5 w-3.5 text-blue-500" /> Sandboxed Directory Index
                        </h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5">Isolated log-verified assets matching active user profile</p>
                      </div>

                      {/* Search and Action */}
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2 h-3 w-3 text-zinc-400" />
                          <input
                            type="text"
                            placeholder="Filter files..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 pr-3 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                          />
                        </div>
                        <button
                          onClick={fetchFiles}
                          disabled={listLoading}
                          className="p-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-md transition-colors text-zinc-500 hover:text-zinc-800 disabled:opacity-50 shrink-0 cursor-pointer"
                        >
                          <RefreshCw className={`h-3 w-3 ${listLoading ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                      {listLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center text-zinc-400 gap-2">
                          <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                          <span className="text-xs font-medium">Indexing isolation sandbox logs...</span>
                        </div>
                      ) : filteredFiles.length === 0 ? (
                        <div className="py-12 text-center text-zinc-400 text-xs max-w-sm mx-auto space-y-2">
                          <File className="h-8 w-8 text-zinc-300 dark:text-zinc-800 mx-auto" />
                          <p className="font-semibold text-zinc-700 dark:text-zinc-300">Sandbox partition is empty</p>
                          <p className="text-[11px]">Any uploaded files will list here via real-time JWT mapping logs.</p>
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                              <th className="p-2.5 pl-4">File Name</th>
                              <th className="p-2.5">File Size</th>
                              <th className="p-2.5">Content Type</th>
                              <th className="p-2.5">Registry Path</th>
                              <th className="p-2.5 text-right pr-4">Download Link</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/40">
                            {filteredFiles.map((file, idx) => (
                              <tr key={file.id || idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors">
                                <td className="p-2.5 pl-4 font-semibold text-zinc-700 dark:text-zinc-200">
                                  <div className="flex items-center gap-2">
                                    <File className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                    <span className="truncate max-w-[180px] font-sans" title={file.name}>
                                      {file.name}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-2.5 font-mono text-zinc-500 dark:text-zinc-400">
                                  {formatBytes(file.size)}
                                </td>
                                <td className="p-2.5">
                                  <span className="inline-block px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[9px] uppercase font-mono font-bold">
                                    {file.type || 'binary/stream'}
                                  </span>
                                </td>
                                <td className="p-2.5 font-mono text-zinc-400 dark:text-zinc-500">
                                  /storage/users/{user.mobile.substring(0, 4)}.../{file.name.substring(0, 8)}...
                                </td>
                                <td className="p-2.5 text-right pr-4">
                                  <button
                                    onClick={() => copyToClipboard(`https://api.cloud.mtos-org.site/storage/users/${user.mobile}/${file.name}`, 'File URL')}
                                    className="px-2 py-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md text-zinc-500 hover:text-blue-500 transition-all font-semibold inline-flex items-center gap-1 cursor-pointer text-[10px]"
                                  >
                                    <Copy className="h-2.5 w-2.5" /> Copy URL
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'billing' && (
                // BILLING OPERATIONS TAB
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Keygen Console card */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-1 flex items-center gap-1.5">
                      <Key className="h-4 w-4 text-blue-500" /> Generate Standalone API Credentials
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                      Automatically binds an alternative unique permanent static string hash to your profile for usage tracking and external server integrations.
                    </p>

                    <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-3">
                      {apiKey ? (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider font-sans">
                              Active Billing API Key
                            </span>
                            <span className="text-[9px] text-zinc-400 font-mono">
                              Unique Profile Bind
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-2">
                            <input
                              type={showApiKey ? "text" : "password"}
                              readOnly
                              value={apiKey}
                              className="flex-1 bg-transparent border-none text-[11px] font-mono focus:outline-none dark:text-white select-all text-zinc-800"
                            />
                            <button
                              type="button"
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                              {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(apiKey, 'API Key')}
                              className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors cursor-pointer"
                              title="Copy key string"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="text-[10px] text-zinc-400">
                            Warning: Keep this credential secure. Anyone holding this API Key can authorize storage writes and trigger resource allocation bills.
                          </p>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 font-sans max-w-md mx-auto">
                            No billing API key allocated for your active vault session. Request a secure bind string instantly.
                          </p>
                          <button
                            onClick={generateApiKey}
                            disabled={keyLoading}
                            className="py-1.5 px-4 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-semibold rounded-md text-xs shadow-xs transition-all flex items-center gap-1.5 mx-auto disabled:opacity-70 disabled:pointer-events-none cursor-pointer"
                          >
                            {keyLoading ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <Key className="h-3 w-3" />
                            )}
                            Generate Standalone Key
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Billing Logs Card */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-zinc-100/20 dark:bg-zinc-900/40">
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-blue-500" /> Transaction & Billing Logs
                        </h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5">Chronological record tracking real-time API integrations and sandbox read/writes</p>
                      </div>

                      <button
                        onClick={fetchBillingLogs}
                        disabled={logsLoading}
                        className="p-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-md transition-colors text-zinc-500 hover:text-zinc-800 disabled:opacity-50 shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                      >
                        <RefreshCw className={`h-3 w-3 ${logsLoading ? 'animate-spin' : ''}`} /> Sync Logs
                      </button>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                      {logsLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center text-zinc-400 gap-2">
                          <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
                          <span className="text-xs font-medium">Retrieving encrypted logs ledger...</span>
                        </div>
                      ) : billingLogs.length === 0 ? (
                        <div className="py-12 text-center text-zinc-400 text-xs max-w-sm mx-auto space-y-2">
                          <FileText className="h-6 w-6 text-zinc-300 dark:text-zinc-800 mx-auto" />
                          <p className="font-semibold text-zinc-700 dark:text-zinc-300">No transactions recorded</p>
                          <p className="text-zinc-400 text-[10px]">Operations like file uploading or credential generation will automatically seed logs here.</p>
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse text-[11px] font-sans">
                          <thead>
                            <tr className="bg-zinc-50 dark:bg-zinc-900/60 text-zinc-500 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                              <th className="p-2.5 pl-4">Operation / API Path</th>
                              <th className="p-2.5">Timestamp</th>
                              <th className="p-2.5">Cost Ratio</th>
                              <th className="p-2.5">IP Host Address</th>
                              <th className="p-2.5 text-right pr-4">Outcome Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/40">
                            {billingLogs.map((log, idx) => (
                              <tr key={log.id || idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors">
                                <td className="p-2.5 pl-4 font-semibold text-zinc-700 dark:text-zinc-200 font-mono text-[11px]">
                                  {log.action || 'Storage Write'}
                                </td>
                                <td className="p-2.5 text-zinc-500 font-mono text-[10px]">
                                  {log.timestamp || 'N/A'}
                                </td>
                                <td className="p-2.5 font-semibold text-blue-500 font-mono">
                                  {log.cost !== undefined ? `$${log.cost.toFixed(4)}` : '$0.0000'}
                                </td>
                                <td className="p-2.5 font-mono text-zinc-400 dark:text-zinc-500">
                                  {log.ip || '127.0.0.1 (Internal Gateway)'}
                                </td>
                                <td className="p-2.5 text-right pr-4">
                                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 text-[9px] border border-emerald-500/20 rounded-full uppercase tracking-wider font-bold">
                                    SUCCESS
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'profile' && (
                // DEVELOPER TOKEN/JWT INSPECT TAB
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-1 flex items-center gap-1.5">
                      <Shield className="h-4 w-4 text-blue-500" /> Active Session Token (JWT JSON)
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                      This cryptographically signed token is automatically issued upon login, validating your identity securely with each storage request header.
                    </p>

                    <div className="space-y-3">
                      {/* JSON Token display */}
                      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-sans">
                            Cryptographic Signature Header
                          </span>
                          <button
                            onClick={() => copyToClipboard(user.token, 'JWT Token')}
                            className="text-[11px] text-blue-500 hover:text-blue-400 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Copy className="h-3 w-3" /> Copy Bearer Token
                          </button>
                        </div>

                        <div className="p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md overflow-x-auto max-h-36">
                          <code className="text-[10px] font-mono text-zinc-500 dark:text-blue-400 break-all select-all whitespace-pre-wrap">
                            {user.token}
                          </code>
                        </div>
                      </div>

                      {/* Decoded Header View */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 space-y-2">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Mapped Token Claims</span>
                          <div className="space-y-1 text-xs font-mono">
                            <div className="flex justify-between py-1 border-b border-zinc-200 dark:border-zinc-800/40 text-[11px]">
                              <span className="text-zinc-500">subject (sub)</span>
                              <span className="text-zinc-800 dark:text-white truncate max-w-[150px] font-semibold">{user.mobile}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-zinc-200 dark:border-zinc-800/40 text-[11px]">
                              <span className="text-zinc-500">issuer (iss)</span>
                              <span className="text-zinc-800 dark:text-white font-semibold">mtos-org.site</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-zinc-200 dark:border-zinc-800/40 text-[11px]">
                              <span className="text-zinc-500">audience (aud)</span>
                              <span className="text-zinc-800 dark:text-white font-semibold">api-cloud</span>
                            </div>
                            <div className="flex justify-between py-1 text-[11px]">
                              <span className="text-zinc-500">algorithm (alg)</span>
                              <span className="text-zinc-800 dark:text-white font-semibold">HS256/RS256</span>
                            </div>
                          </div>
                        </div>

                        <div className="border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 space-y-2">
                          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Session Lifecycle</span>
                          <div className="space-y-1 text-xs font-mono">
                            <div className="flex justify-between py-1 border-b border-zinc-200 dark:border-zinc-800/40 text-[11px]">
                              <span className="text-zinc-500">Issued At (iat)</span>
                              <span className="text-zinc-800 dark:text-white font-semibold">Active Session</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-zinc-200 dark:border-zinc-800/40 text-[11px]">
                              <span className="text-zinc-500">Expiry (exp)</span>
                              <span className="text-zinc-800 dark:text-white font-semibold">Never expires (Stateless JWT)</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-zinc-200 dark:border-zinc-800/40 text-[11px]">
                              <span className="text-zinc-500">Auth Scope</span>
                              <span className="text-zinc-800 dark:text-white font-semibold">All permissions (read/write)</span>
                            </div>
                            <div className="flex justify-between py-1 text-[11px]">
                              <span className="text-zinc-500">Encryption status</span>
                              <span className="text-emerald-500 font-semibold flex items-center gap-1">
                                <Check className="h-3 w-3" /> Secure Signature Verified
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </motion.div>
              )}

            </div>
          </main>
        </div>
      )}
    </div>
  );
}
