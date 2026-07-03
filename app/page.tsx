'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp, CloudFile, CloudFolder } from '@/lib/context';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cloud,
  Upload,
  HardDrive,
  Folder,
  FolderPlus,
  Star,
  Trash,
  Trash2,
  User,
  Search,
  Copy,
  Check,
  Eye,
  EyeOff,
  Activity,
  File,
  CircleAlert,
  Clock,
  ArrowLeft,
  Grid,
  List,
  MoreVertical,
  Download,
  Edit3,
  FolderOpen,
  FileText,
  LayoutGrid,
  Settings,
  RefreshCw,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  FileImage,
  FileAudio,
  FileVideo,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';

export default function Home() {
  const {
    theme,
    toggleTheme,
    user,
    authLoading,
    uploadLoading,
    listLoading,
    files,
    folders,
    billingLogs,
    quota,
    alerts,
    addAlert,
    removeAlert,
    signUp,
    logIn,
    logOut,
    uploadFile,
    fetchFiles,
    deleteFile,
    restoreFile,
    toggleStar,
    renameFile,
    moveFile,
    createFolder,
    deleteFolder,
    fetchFolders,
    fetchBillingLogs
  } = useApp();

  // Navigation and filters
  const [activeTab, setActiveTab] = useState<'dashboard' | 'drive' | 'starred' | 'trash' | 'profile'>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Folder navigation state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  // File explorer filtering & layout
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'size-desc' | 'size-asc'>('date-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFile, setSelectedFile] = useState<CloudFile | null>(null);
  
  // Custom dialogs/overlays
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  
  const [movingFile, setMovingFile] = useState<CloudFile | null>(null);
  const [isMoveFolderOpen, setIsMoveFolderOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Auth local inputs
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [signupName, setSignupName] = useState('');
  const [signupMobile, setSignupMobile] = useState('');
  const [signupCountry, setSignupCountry] = useState('United States');
  const [signupPassword, setSignupPassword] = useState('');
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Drag and drop states
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  // Storage Limit (Dynamic server quota or 100 MB fallback)
  const STORAGE_LIMIT = quota?.total || 100 * 1024 * 1024;

  // Auto-fetch data on tab switches or folder switches when user is active
  useEffect(() => {
    if (user) {
      fetchFiles();
      fetchFolders();
      fetchBillingLogs();
    }
  }, [user, activeTab]);

  // Form handle helpers
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupMobile || !signupPassword) {
      addAlert('Please fill out all fields.', 'error');
      return;
    }
    // Generate email as mobile@mtos-org.com
    const cleanMobile = signupMobile.replace(/[^a-zA-Z0-9]/g, '');
    const generatedEmail = `${cleanMobile || 'mobile'}@mtos-org.com`;

    const success = await signUp({
      name: signupName,
      mobile: signupMobile,
      country: signupCountry,
      password: signupPassword,
      email: generatedEmail
    });
    if (success) {
      setAuthMode('login');
      setLoginEmail(generatedEmail);
    }
  };

  const handleLogIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      addAlert('Please fill out all login credentials.', 'error');
      return;
    }
    await logIn({
      email: loginEmail,
      password: loginPassword
    });
  };

  // Drag & drop file upload
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      addAlert(`Uploading ${droppedFiles.length} file(s)...`, 'info');
      for (const file of droppedFiles) {
        await uploadFile(file, currentFolderId);
      }
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      addAlert(`Uploading ${selectedFiles.length} file(s)...`, 'info');
      for (const file of selectedFiles) {
        await uploadFile(file, currentFolderId);
      }
    }
  };

  // Storage Stats Calculation
  const getStorageStats = () => {
    const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);
    const percent = Math.min(100, (totalSize / STORAGE_LIMIT) * 100);
    
    // Split by categories
    let imagesSize = 0, imagesCount = 0;
    let docsSize = 0, docsCount = 0;
    let mediaSize = 0, mediaCount = 0;
    let otherSize = 0, otherCount = 0;

    files.forEach(f => {
      const type = (f.type || '').toLowerCase();
      if (type.startsWith('image/')) {
        imagesSize += f.size || 0;
        imagesCount++;
      } else if (
        type.includes('pdf') ||
        type.includes('word') ||
        type.includes('excel') ||
        type.includes('powerpoint') ||
        type.includes('text') ||
        type.includes('plain') ||
        type.includes('document')
      ) {
        docsSize += f.size || 0;
        docsCount++;
      } else if (type.startsWith('audio/') || type.startsWith('video/')) {
        mediaSize += f.size || 0;
        mediaCount++;
      } else {
        otherSize += f.size || 0;
        otherCount++;
      }
    });

    return {
      totalSize,
      percent,
      imagesSize,
      imagesCount,
      docsSize,
      docsCount,
      mediaSize,
      mediaCount,
      otherSize,
      otherCount
    };
  };

  const stats = getStorageStats();

  const formatSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (type?: string) => {
    const t = (type || '').toLowerCase();
    if (t.startsWith('image/')) return <FileImage className="h-8 w-8 text-rose-500 shrink-0" />;
    if (t.startsWith('audio/')) return <FileAudio className="h-8 w-8 text-purple-500 shrink-0" />;
    if (t.startsWith('video/')) return <FileVideo className="h-8 w-8 text-amber-500 shrink-0" />;
    if (t.includes('pdf') || t.includes('word') || t.includes('text') || t.includes('plain')) {
      return <FileText className="h-8 w-8 text-blue-500 shrink-0" />;
    }
    return <File className="h-8 w-8 text-zinc-500 shrink-0" />;
  };

  // Filtered files depending on active route
  const getFilteredFiles = () => {
    let result = [...files];

    // 1. Tab filters
    if (activeTab === 'starred') {
      result = result.filter(f => f.isStarred && !f.isTrashed);
    } else if (activeTab === 'trash') {
      result = result.filter(f => f.isTrashed);
    } else {
      // Normal drive or dashboard view
      result = result.filter(f => !f.isTrashed);
      
      // If inside a folder and on My Drive
      if (activeTab === 'drive') {
        result = result.filter(f => f.folderId === currentFolderId);
      }
    }

    // 2. Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(f => f.name.toLowerCase().includes(q));
    }

    // 3. Sorting
    result.sort((a, b) => {
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
      if (sortBy === 'size-desc') return (b.size || 0) - (a.size || 0);
      if (sortBy === 'size-asc') return (a.size || 0) - (b.size || 0);
      if (sortBy === 'date-asc') return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(); // date-desc
    });

    return result;
  };

  const filteredFiles = getFilteredFiles();

  // Helper folder calculations
  const getFolderFilesCount = (folderId: string) => {
    return files.filter(f => f.folderId === folderId && !f.isTrashed).length;
  };

  const getFolderFilesSize = (folderId: string) => {
    return files
      .filter(f => f.folderId === folderId && !f.isTrashed)
      .reduce((sum, f) => sum + (f.size || 0), 0);
  };

  // Real direct physical file download from storage.php
  const triggerDownload = (file: CloudFile) => {
    if (!user) {
      addAlert('Authentication required to download files.', 'error');
      return;
    }
    addAlert(`Initiating download for "${file.name}"...`, 'info');
    
    // Direct physical download link from storage.php
    const downloadUrl = `https://api.cloud.mtos-org.site/storage.php?country=${encodeURIComponent(user.country)}&email=${encodeURIComponent(user.email)}&file=${encodeURIComponent(file.name)}`;
    
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = file.name;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addAlert(`Successfully downloaded "${file.name}"!`, 'success');
  };

  // Helper to filter files by category
  const getCategoryFiles = (categoryName: string) => {
    return files.filter(f => {
      if (f.isTrashed) return false;
      const type = (f.type || '').toLowerCase();
      if (categoryName === 'Images') {
        return type.startsWith('image/');
      } else if (categoryName === 'Documents') {
        return (
          type.includes('pdf') ||
          type.includes('word') ||
          type.includes('excel') ||
          type.includes('powerpoint') ||
          type.includes('text') ||
          type.includes('plain') ||
          type.includes('document')
        );
      } else if (categoryName === 'Media Files') {
        return type.startsWith('audio/') || type.startsWith('video/');
      } else {
        // Others & Archives
        const isImg = type.startsWith('image/');
        const isDoc = (
          type.includes('pdf') ||
          type.includes('word') ||
          type.includes('excel') ||
          type.includes('powerpoint') ||
          type.includes('text') ||
          type.includes('plain') ||
          type.includes('document')
        );
        const isMedia = type.startsWith('audio/') || type.startsWith('video/');
        return !isImg && !isDoc && !isMedia;
      }
    });
  };

  // Helper trigger to copy mock secure drive share URL
  const copyShareLink = (file: CloudFile) => {
    const mockUrl = `${window.location.origin}/drive/share/${file.id}`;
    navigator.clipboard.writeText(mockUrl);
    addAlert('Secure drive file share link copied to clipboard!', 'success');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 flex flex-col font-sans transition-colors duration-150">
      
      {/* ALERTS SYSTEM */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
        <AnimatePresence>
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -5 }}
              className={`p-3.5 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2.5 border backdrop-blur-md pointer-events-auto ${
                alert.type === 'success'
                  ? 'bg-emerald-500/10 dark:bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : alert.type === 'error'
                  ? 'bg-rose-500/10 dark:bg-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-400'
                  : 'bg-blue-500/10 dark:bg-blue-500/5 border-blue-500/20 text-blue-600 dark:text-blue-400'
              }`}
            >
              <Info className="h-4 w-4 shrink-0" />
              <div className="flex-1">{alert.text}</div>
              <button
                onClick={() => removeAlert(alert.id)}
                className="hover:bg-zinc-200 dark:hover:bg-zinc-800 p-0.5 rounded cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!user ? (
        // AUTHENTICATION VIEW
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-radial from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-8 backdrop-blur-md"
          >
            <div className="flex flex-col items-center mb-8 text-center">
              <div className="h-12 w-12 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20 mb-3 text-blue-600 dark:text-blue-400">
                <Cloud className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                MTOS Cloud Drive
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">
                Securely store, organize, and access your folders & files anywhere.
              </p>
            </div>

            <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 mb-6">
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 text-center py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthMode('signup')}
                className={`flex-1 text-center py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  authMode === 'signup'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                Create Drive Account
              </button>
            </div>

            <form onSubmit={authMode === 'login' ? handleLogIn : handleSignUp} className="space-y-4">
              {authMode === 'signup' && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="e.g. Salman Ahmad"
                      className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={signupMobile}
                      onChange={(e) => setSignupMobile(e.target.value)}
                      placeholder="e.g. +1 (555) 019-2834"
                      className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Country
                    </label>
                    <select
                      value={signupCountry}
                      onChange={(e) => setSignupCountry(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="India">India</option>
                      <option value="Germany">Germany</option>
                      <option value="Australia">Australia</option>
                    </select>
                  </div>
                </>
              )}

              {authMode === 'login' && (
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. user@mtos-drive.com"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Password Key
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={authMode === 'login' ? loginPassword : signupPassword}
                    onChange={(e) => authMode === 'login' ? setLoginPassword(e.target.value) : setSignupPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3 pr-10 py-2 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {authLoading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Please Wait...
                  </>
                ) : (
                  <>{authMode === 'login' ? 'Sign In to Drive' : 'Initialize Personal Workspace'}</>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      ) : (
        // CLOUD DRIVE PLATFORM LAYOUT
        <div 
          className="flex-1 flex flex-col md:flex-row relative"
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* DRAG OVERLAY DROPMASK */}
          <AnimatePresence>
            {isDragging && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-blue-600/10 dark:bg-blue-900/20 backdrop-blur-xs z-50 flex items-center justify-center border-4 border-dashed border-blue-500"
              >
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 max-w-sm text-center flex flex-col items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-500 animate-bounce">
                    <Upload className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">Drop to Upload</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Release your files to store them inside this directory vault.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SIDEBAR FOR DESKTOP */}
          <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-5 gap-6 shrink-0">
            {/* Brand Logo */}
            <div className="flex items-center gap-3 px-1.5">
              <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
                <Cloud className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-blue-600 font-mono">
                  MTOS Drive
                </span>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold leading-none mt-0.5">Cloud Space</p>
              </div>
            </div>

            {/* Quick Upload Button */}
            <div className="relative">
              <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer select-none">
                <Upload className="h-3.5 w-3.5" />
                Upload New File
                <input
                  type="file"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Nav Menu */}
            <nav className="flex-1 space-y-1">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
                { id: 'drive', label: 'My Drive', icon: HardDrive },
                { id: 'starred', label: 'Starred Files', icon: Star },
                { id: 'trash', label: 'Trash Bin', icon: Trash },
                { id: 'profile', label: 'Storage Settings', icon: Settings },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      if (item.id !== 'drive') {
                        setCurrentFolderId(null); // Reset deep path
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold border-l-2 transition-all cursor-pointer ${
                      activeTab === item.id
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 border-blue-500 shadow-xs'
                        : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Storage Progress Meter */}
            <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                <span>Storage space</span>
                <span>{stats.percent.toFixed(1)}% Used</span>
              </div>
              <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    stats.percent > 85 ? 'bg-rose-500' : stats.percent > 60 ? 'bg-amber-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${stats.percent}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                <strong>{formatSize(stats.totalSize)}</strong> of 100 MB free sandbox tier used.
              </p>
            </div>

            {/* User Profile Quick Bar */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center font-bold text-xs shrink-0 uppercase text-blue-600 dark:text-blue-400">
                  {user.name.charAt(0)}
                </div>
                <div className="overflow-hidden leading-tight">
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate">{user.name}</h4>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={logOut}
                title="Log Out"
                className="hover:bg-rose-500/10 hover:text-rose-600 p-1.5 rounded-lg text-zinc-400 cursor-pointer shrink-0 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </aside>

          {/* MOBILE HEADER BAR */}
          <header className="md:hidden flex items-center justify-between bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Cloud className="h-4 w-4" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-zinc-900 dark:text-white font-mono">
                MTOS Drive
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="hover:bg-zinc-100 dark:hover:bg-zinc-800 p-1.5 rounded-lg text-zinc-400"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="hover:bg-zinc-100 dark:hover:bg-zinc-800 p-1.5 rounded-lg text-zinc-400"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </header>

          {/* MOBILE NAVIGATION MENU */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <>
                {/* Backdrop overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-40"
                />

                {/* Left-to-right drawer panel */}
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="md:hidden fixed inset-y-0 left-0 w-72 max-w-[80vw] bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col z-50 p-5 shadow-2xl"
                >
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-850 pb-4 mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                        <Cloud className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-blue-600 font-mono">
                          MTOS Drive
                        </span>
                        <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold leading-none mt-0.5">Cloud Space</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="hover:bg-zinc-100 dark:hover:bg-zinc-800 p-1.5 rounded-lg text-zinc-400 cursor-pointer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex-1 flex flex-col gap-5 overflow-y-auto">
                    {/* Quick Upload Button */}
                    <div className="relative">
                      <label className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer select-none">
                        <Upload className="h-3.5 w-3.5" />
                        Upload New File
                        <input
                          type="file"
                          multiple
                          onChange={handleFileInputChange}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Nav Items */}
                    <nav className="space-y-1">
                      {[
                        { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
                        { id: 'drive', label: 'My Drive', icon: HardDrive },
                        { id: 'starred', label: 'Starred Files', icon: Star },
                        { id: 'trash', label: 'Trash Bin', icon: Trash },
                        { id: 'profile', label: 'Storage Settings', icon: Settings },
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveTab(item.id as any);
                              setIsMobileMenuOpen(false);
                              if (item.id !== 'drive') {
                                setCurrentFolderId(null); // Reset deep path
                              }
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold border-l-2 transition-all cursor-pointer ${
                              activeTab === item.id
                                ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 border-blue-500 shadow-xs'
                                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850 hover:text-zinc-900 dark:hover:text-zinc-100'
                            }`}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            {item.label}
                          </button>
                        );
                      })}
                    </nav>

                    {/* Storage Progress Meter */}
                    <div className="mt-auto bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        <span>Storage space</span>
                        <span>{stats.percent.toFixed(1)}% Used</span>
                      </div>
                      <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            stats.percent > 85 ? 'bg-rose-500' : stats.percent > 60 ? 'bg-amber-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${stats.percent}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                        <strong>{formatSize(stats.totalSize)}</strong> of {formatSize(STORAGE_LIMIT)} cloud quota used.
                      </p>
                    </div>
                  </div>

                  {/* Drawer Footer / Profile section */}
                  <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-5 flex items-center justify-between gap-2.5 shrink-0">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center font-bold text-xs shrink-0 uppercase text-blue-600 dark:text-blue-400">
                        {user.name.charAt(0)}
                      </div>
                      <div className="overflow-hidden leading-tight">
                        <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate">{user.name}</h4>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={logOut}
                      title="Log Out"
                      className="hover:bg-rose-500/10 hover:text-rose-600 p-1.5 rounded-lg text-zinc-400 cursor-pointer shrink-0 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* MAIN EXPLORER AREA */}
          <main className="flex-1 flex flex-col min-w-0 bg-zinc-50 dark:bg-zinc-950 overflow-y-auto">
            
            {/* CONSOLE STATUS BAR FOR DESKTOP */}
            <div className="hidden md:flex items-center justify-between px-8 py-3.5 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                  Drive Status: ACTIVE SECURE CLOUD SYNC
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* Theme Toggle Button */}
                <button
                  onClick={toggleTheme}
                  className="hover:bg-zinc-100 dark:hover:bg-zinc-800 p-1.5 rounded-lg text-zinc-400 cursor-pointer transition-colors"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>

                <div className="text-xs font-mono text-zinc-500">
                  Logged in: <strong className="text-zinc-700 dark:text-zinc-300 font-bold">{user.email}</strong>
                </div>
              </div>
            </div>

            {/* IN-PAGE CONTENT WRAPPER */}
            <div className="flex-1 p-6 md:p-8 space-y-6">
              
              {/* DASHBOARD VIEW */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Greeting banner */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                      <Cloud className="h-40 w-40" />
                    </div>
                    <div className="max-w-xl space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-blue-500/30 text-blue-100 px-2 py-0.5 rounded-full font-mono">
                        Welcome Back
                      </span>
                      <h2 className="text-lg md:text-xl font-extrabold tracking-tight">
                        Hello, {user.name}!
                      </h2>
                      <p className="text-blue-100 text-xs leading-relaxed max-w-lg">
                        Keep your sensitive documents, photos, and team files organized. Drag and drop any asset to encrypt and sync to secure storage.
                      </p>
                      <div className="pt-2 flex gap-2">
                        <button
                          onClick={() => setActiveTab('drive')}
                          className="py-1 px-3 bg-white text-blue-600 hover:bg-zinc-100 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          Browse Files
                        </button>
                        <button
                          onClick={() => setIsCreateFolderOpen(true)}
                          className="py-1 px-3 bg-blue-500 text-white hover:bg-blue-400 font-bold text-xs rounded-lg transition-colors border border-blue-400 cursor-pointer"
                        >
                          Create Folder
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Storage Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      {
                        title: 'Images',
                        count: stats.imagesCount,
                        size: stats.imagesSize,
                        color: 'bg-rose-500',
                        bg: 'bg-rose-50 dark:bg-rose-950/10',
                        border: 'border-rose-100 dark:border-rose-950/30',
                        icon: FileImage
                      },
                      {
                        title: 'Documents',
                        count: stats.docsCount,
                        size: stats.docsSize,
                        color: 'bg-blue-500',
                        bg: 'bg-blue-50 dark:bg-blue-950/10',
                        border: 'border-blue-100 dark:border-blue-950/30',
                        icon: FileText
                      },
                      {
                        title: 'Media Files',
                        count: stats.mediaCount,
                        size: stats.mediaSize,
                        color: 'bg-amber-500',
                        bg: 'bg-amber-50 dark:bg-amber-950/10',
                        border: 'border-amber-100 dark:border-amber-950/30',
                        icon: FileVideo
                      },
                      {
                        title: 'Others & Archives',
                        count: stats.otherCount,
                        size: stats.otherSize,
                        color: 'bg-zinc-500',
                        bg: 'bg-zinc-100/50 dark:bg-zinc-900/40',
                        border: 'border-zinc-200 dark:border-zinc-800',
                        icon: File
                      }
                    ].map((card) => {
                      const Icon = card.icon;
                      return (
                        <button
                          key={card.title}
                          onClick={() => setSelectedCategory(card.title)}
                          className={`p-4 rounded-xl border ${card.bg} ${card.border} flex items-center justify-between text-left cursor-pointer hover:shadow-md transition-all group`}
                        >
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block group-hover:text-blue-500 transition-colors">
                              {card.title}
                            </span>
                            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
                              {card.count} {card.count === 1 ? 'file' : 'files'}
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              Size: <strong>{formatSize(card.size)}</strong>
                            </p>
                          </div>
                          <div className={`h-10 w-10 rounded-lg ${card.color}/10 border ${card.color}/20 flex items-center justify-center text-zinc-900 dark:text-zinc-100 group-hover:scale-110 transition-transform`}>
                            <Icon className="h-5 w-5" />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Dashboard Explorer Preview */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Uploads block */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-xs lg:col-span-2 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                            Recent Uploads Catalog
                          </h3>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">The last assets synced to your secure cloud space.</p>
                        </div>
                        <button
                          onClick={() => setActiveTab('drive')}
                          className="text-[11px] text-blue-500 hover:underline font-bold"
                        >
                          View All
                        </button>
                      </div>

                      {files.filter(f => !f.isTrashed).length === 0 ? (
                        <div className="py-12 flex flex-col items-center text-center gap-2.5">
                          <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                            <Cloud className="h-5 w-5 animate-pulse" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">No active files found</h4>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 max-w-xs mt-0.5">
                              Drag and drop a file or folder into My Drive root to index it here.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="divide-y divide-zinc-200 dark:divide-zinc-800/40">
                          {files
                            .filter(f => !f.isTrashed)
                            .slice(0, 4)
                            .map((file) => (
                              <div
                                key={file.id}
                                className="py-2.5 flex items-center justify-between gap-3 group hover:bg-zinc-50 dark:hover:bg-zinc-850 px-2 rounded-lg transition-all"
                              >
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                  {getFileIcon(file.type)}
                                  <div className="overflow-hidden leading-tight">
                                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate group-hover:text-blue-500 transition-colors">
                                      {file.name}
                                    </h4>
                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                                      {formatSize(file.size)} • {new Date(file.uploadedAt).toLocaleString()}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex gap-1">
                                  <button
                                    onClick={() => toggleStar(file.id, !file.isStarred)}
                                    className={`p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 cursor-pointer ${
                                      file.isStarred ? 'text-amber-500' : 'text-zinc-400'
                                    }`}
                                  >
                                    <Star className="h-3.5 w-3.5 fill-current" />
                                  </button>
                                  <button
                                    onClick={() => triggerDownload(file)}
                                    className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Quick navigation and folder directory layout */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-xs space-y-4">
                      <div>
                        <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                          Quick Folder Directory
                        </h3>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Access virtual storage folder groups.</p>
                      </div>

                      {folders.length === 0 ? (
                        <div className="py-8 flex flex-col items-center justify-center text-center gap-2 text-zinc-400">
                          <FolderPlus className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
                          <p className="text-[11px]">No custom folders yet.</p>
                          <button
                            onClick={() => setIsCreateFolderOpen(true)}
                            className="text-[11px] text-blue-500 font-bold hover:underline"
                          >
                            Create standard folder now
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                          {folders.slice(0, 5).map((f) => (
                            <button
                              key={f.id}
                              onClick={() => {
                                setCurrentFolderId(f.id);
                                setActiveTab('drive');
                              }}
                              className="w-full flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-850 text-left transition-all group"
                            >
                              <div className="flex items-center gap-2">
                                <Folder className="h-4 w-4 text-blue-500 shrink-0 fill-current" />
                                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-blue-500 transition-colors">
                                  {f.name}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-zinc-400">
                                {getFolderFilesCount(f.id)} items
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* MY DRIVE (FILE EXPLORER) VIEW */}
              {activeTab === 'drive' && (
                <div className="space-y-5">
                  
                  {/* File browser top actions bar */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs flex flex-col gap-4">
                    
                    {/* Row 1: Search & sorting */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Live search bar */}
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search files by name..."
                          className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>

                      {/* Sorting & Layout mode */}
                      <div className="flex items-center gap-2">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-none"
                        >
                          <option value="date-desc">Newest Uploads</option>
                          <option value="date-asc">Oldest Uploads</option>
                          <option value="name-asc">Name (A - Z)</option>
                          <option value="name-desc">Name (Z - A)</option>
                          <option value="size-desc">Largest Size</option>
                          <option value="size-asc">Smallest Size</option>
                        </select>

                        {/* Layout grid vs list toggle */}
                        <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5 bg-zinc-50 dark:bg-zinc-950">
                          <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md ${
                              viewMode === 'grid' ? 'bg-white dark:bg-zinc-800 text-blue-500 shadow-xs' : 'text-zinc-400'
                            }`}
                            title="Grid Layout"
                          >
                            <Grid className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md ${
                              viewMode === 'list' ? 'bg-white dark:bg-zinc-800 text-blue-500 shadow-xs' : 'text-zinc-400'
                            }`}
                            title="List Layout"
                          >
                            <List className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Breadcrumbs path & Quick Action buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/60">
                      
                      {/* Breadcrumbs directory navigation */}
                      <div className="flex items-center gap-1 text-xs">
                        <button
                          onClick={() => setCurrentFolderId(null)}
                          className={`hover:text-blue-500 font-bold transition-colors cursor-pointer ${
                            currentFolderId === null ? 'text-zinc-900 dark:text-white' : 'text-zinc-500'
                          }`}
                        >
                          My Drive
                        </button>

                        {currentFolderId !== null && (
                          <>
                            <ChevronRight className="h-3 w-3 text-zinc-400" />
                            <span className="font-bold text-zinc-900 dark:text-white">
                              {folders.find(f => f.id === currentFolderId)?.name || 'Folder'}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Operational buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsCreateFolderOpen(true)}
                          className="py-1.5 px-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <FolderPlus className="h-3.5 w-3.5" />
                          New Folder
                        </button>
                        <label className="py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs select-none">
                          <Upload className="h-3.5 w-3.5" />
                          Upload File
                          <input type="file" multiple onChange={handleFileInputChange} className="hidden" />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* FOLDERS DIRECTORY MAP GRID (ONLY at ROOT level, or disable when deep folder exploration) */}
                  {currentFolderId === null && (
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-mono">
                        Virtual Folders
                      </h3>
                      {folders.length === 0 ? (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">No storage folders defined. Click &quot;New Folder&quot; to begin grouping.</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                          {folders.map((f) => (
                            <div
                              key={f.id}
                              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 flex flex-col justify-between hover:border-blue-500/50 hover:shadow-md transition-all group"
                            >
                              <div
                                onClick={() => setCurrentFolderId(f.id)}
                                className="flex-1 cursor-pointer"
                              >
                                <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all mb-2.5">
                                  <Folder className="h-5 w-5 fill-current" />
                                </div>
                                <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-blue-500 transition-colors">
                                  {f.name}
                                </h4>
                                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">
                                  {getFolderFilesCount(f.id)} files • {formatSize(getFolderFilesSize(f.id))}
                                </p>
                              </div>

                              <div className="flex items-center justify-end pt-2 border-t border-zinc-100 dark:border-zinc-850/60 mt-2">
                                <button
                                  onClick={() => deleteFolder(f.id)}
                                  className="text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 p-1 rounded transition-all cursor-pointer"
                                  title="Delete Folder"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* FILES SECTION */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-mono">
                        {currentFolderId === null ? 'All Files (Root)' : 'Files inside this folder'}
                      </h3>
                      <span className="text-[10px] font-mono text-zinc-500">{filteredFiles.length} item(s)</span>
                    </div>

                    {filteredFiles.length === 0 ? (
                      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 py-16 px-4 rounded-xl text-center flex flex-col items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                          <Cloud className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100">Empty Directory View</h4>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-sm mt-0.5">
                            This directory segment contains no files. Upload a file or drop one onto the viewport to sync storage.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {viewMode === 'grid' ? (
                          // GRID LAYOUT VIEW
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {filteredFiles.map((file) => (
                              <div
                                key={file.id}
                                className={`bg-white dark:bg-zinc-900 border rounded-xl p-3.5 flex flex-col justify-between hover:shadow-md transition-all group ${
                                  selectedFile?.id === file.id
                                    ? 'border-blue-500 ring-2 ring-blue-500/10'
                                    : 'border-zinc-200 dark:border-zinc-800'
                                }`}
                              >
                                <div 
                                  onClick={() => setSelectedFile(file)}
                                  className="flex-1 cursor-pointer flex flex-col"
                                >
                                  {/* File Category Icon Header Block */}
                                  <div className="bg-zinc-50 dark:bg-zinc-950 rounded-lg py-5 flex items-center justify-center border border-zinc-100 dark:border-zinc-850 mb-3">
                                    {getFileIcon(file.type)}
                                  </div>

                                  {/* File metadata */}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate group-hover:text-blue-500 transition-colors" title={file.name}>
                                      {file.name}
                                    </h4>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="text-[10px] font-mono text-zinc-400">{formatSize(file.size)}</span>
                                      {file.folderId && (
                                        <span className="text-[8px] bg-blue-100/60 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold px-1 rounded truncate">
                                          {folders.find(f => f.id === file.folderId)?.name}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono mt-1">
                                      {new Date(file.uploadedAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>

                                {/* Actions bottom strip */}
                                <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-850/60 pt-2.5 mt-2.5">
                                  <button
                                    onClick={() => toggleStar(file.id, !file.isStarred)}
                                    className={`p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer ${
                                      file.isStarred ? 'text-amber-500' : 'text-zinc-400'
                                    }`}
                                  >
                                    <Star className="h-3.5 w-3.5 fill-current" />
                                  </button>
                                  
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => {
                                        setRenameValue(file.name);
                                        setRenamingFileId(file.id);
                                      }}
                                      className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-blue-500 cursor-pointer"
                                      title="Rename"
                                    >
                                      <Edit3 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setMovingFile(file);
                                        setIsMoveFolderOpen(true);
                                      }}
                                      className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-blue-500 cursor-pointer"
                                      title="Move to folder"
                                    >
                                      <FolderOpen className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => triggerDownload(file)}
                                      className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-blue-500 cursor-pointer"
                                      title="Download"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => deleteFile(file.id, false)}
                                      className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-rose-500 cursor-pointer"
                                      title="Trash"
                                    >
                                      <Trash className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          // LIST LAYOUT VIEW
                          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-zinc-50 dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-bold">
                                    <th className="p-3 pl-4">Name</th>
                                    <th className="p-3">File Type</th>
                                    <th className="p-3">Folder Location</th>
                                    <th className="p-3">Size</th>
                                    <th className="p-3">Uploaded At</th>
                                    <th className="p-3 text-right pr-4">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/40">
                                  {filteredFiles.map((file) => (
                                    <tr 
                                      key={file.id} 
                                      className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors ${
                                        selectedFile?.id === file.id ? 'bg-blue-50/30 dark:bg-blue-950/15' : ''
                                      }`}
                                    >
                                      <td className="p-3 pl-4">
                                        <div 
                                          className="flex items-center gap-2.5 cursor-pointer"
                                          onClick={() => setSelectedFile(file)}
                                        >
                                          {getFileIcon(file.type)}
                                          <span className="font-bold text-zinc-800 dark:text-zinc-100 truncate max-w-[200px]" title={file.name}>
                                            {file.name}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="p-3 text-zinc-500 dark:text-zinc-400 font-mono text-[10.5px]">
                                        {file.type || 'application/octet-stream'}
                                      </td>
                                      <td className="p-3">
                                        {file.folderId ? (
                                          <span className="px-2 py-0.5 bg-blue-100/60 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded">
                                            {folders.find(f => f.id === file.folderId)?.name}
                                          </span>
                                        ) : (
                                          <span className="text-zinc-400 italic text-[10px]">My Drive (Root)</span>
                                        )}
                                      </td>
                                      <td className="p-3 font-mono text-zinc-500">{formatSize(file.size)}</td>
                                      <td className="p-3 text-zinc-500">{new Date(file.uploadedAt).toLocaleString()}</td>
                                      <td className="p-3 text-right pr-4">
                                        <div className="flex justify-end gap-1">
                                          <button
                                            onClick={() => toggleStar(file.id, !file.isStarred)}
                                            className={`p-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer ${
                                              file.isStarred ? 'text-amber-500' : 'text-zinc-400'
                                            }`}
                                          >
                                            <Star className="h-3.5 w-3.5 fill-current" />
                                          </button>
                                          <button
                                            onClick={() => triggerDownload(file)}
                                            className="p-1.5 text-zinc-400 hover:text-blue-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                                            title="Download"
                                          >
                                            <Download className="h-3.5 w-3.5" />
                                          </button>
                                          <button
                                            onClick={() => deleteFile(file.id, false)}
                                            className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                                            title="Trash"
                                          >
                                            <Trash className="h-3.5 w-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* STARRED TAB VIEW */}
              {activeTab === 'starred' && (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-xs">
                    <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      <Star className="h-5 w-5 text-amber-500 fill-current" />
                      Starred Vault Assets
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">
                      Quickly access folders or files tagged with critical importance.
                    </p>
                  </div>

                  {filteredFiles.length === 0 ? (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 py-16 text-center flex flex-col items-center gap-3 rounded-xl">
                      <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <Star className="h-5 w-5 fill-current" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100 font-sans">No Starred Items yet</h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-sm mt-0.5">
                          Tag folders or files with stars directly inside the browser file lists to pin them in this list.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {filteredFiles.map((file) => (
                        <div
                          key={file.id}
                          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between hover:shadow-md transition-all group"
                        >
                          <div 
                            onClick={() => setSelectedFile(file)}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="bg-zinc-50 dark:bg-zinc-950 rounded-lg py-5 flex items-center justify-center border border-zinc-100 dark:border-zinc-850 mb-3">
                              {getFileIcon(file.type)}
                            </div>
                            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate group-hover:text-blue-500 transition-colors">
                              {file.name}
                            </h4>
                            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{formatSize(file.size)}</p>
                          </div>

                          <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-850 pt-2.5 mt-2.5">
                            <button
                              onClick={() => toggleStar(file.id, false)}
                              className="text-amber-500 hover:text-zinc-400 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                              title="Unstar"
                            >
                              <Star className="h-3.5 w-3.5 fill-current" />
                            </button>
                            <div className="flex gap-1">
                              <button
                                onClick={() => triggerDownload(file)}
                                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-blue-500 transition-colors cursor-pointer"
                                title="Download"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => deleteFile(file.id, false)}
                                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
                                title="Trash"
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TRASH VIEW */}
              {activeTab === 'trash' && (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Trash className="h-5 w-5 text-rose-500" />
                        Trash Storage Bin
                      </h2>
                      <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">
                        Files inside this segment are temporarily stored and can be restored or purged permanently.
                      </p>
                    </div>

                    {filteredFiles.length > 0 && (
                      <button
                        onClick={() => {
                          const conf = confirm('Are you sure you want to permanently purge all items in the Trash?');
                          if (conf) {
                            filteredFiles.forEach(f => deleteFile(f.id, true));
                          }
                        }}
                        className="py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Empty Trash Bin
                      </button>
                    )}
                  </div>

                  {filteredFiles.length === 0 ? (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 py-16 text-center flex flex-col items-center gap-3 rounded-xl">
                      <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                        <Trash className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100 font-sans">Trash bin is clean</h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-sm mt-0.5">
                          Files you delete from My Drive will be staged in the trash temporarily.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {filteredFiles.map((file) => (
                        <div
                          key={file.id}
                          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between hover:shadow-md transition-all group"
                        >
                          <div>
                            <div className="bg-zinc-50 dark:bg-zinc-950 rounded-lg py-5 flex items-center justify-center border border-zinc-100 dark:border-zinc-850 mb-3">
                              {getFileIcon(file.type)}
                            </div>
                            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate" title={file.name}>
                              {file.name}
                            </h4>
                            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{formatSize(file.size)}</p>
                          </div>

                          <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-850 pt-2.5 mt-2.5">
                            <button
                              onClick={() => restoreFile(file.id)}
                              className="py-1 px-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold rounded text-[10px] hover:bg-zinc-200 transition-all cursor-pointer"
                            >
                              Restore
                            </button>
                            <button
                              onClick={() => deleteFile(file.id, true)}
                              className="p-1 rounded hover:bg-rose-500/10 text-zinc-400 hover:text-rose-500 transition-all cursor-pointer"
                              title="Delete Permanently"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* PROFILE & LOGS VIEW */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  
                  {/* Personal details card */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl shadow-xs space-y-4">
                      <div className="flex flex-col items-center text-center">
                        <div className="h-16 w-16 rounded-full bg-blue-600/10 border-2 border-blue-500/20 text-blue-600 flex items-center justify-center font-bold text-2xl uppercase mb-3">
                          {user.name.charAt(0)}
                        </div>
                        <h3 className="text-base font-bold text-zinc-900 dark:text-white leading-tight">{user.name}</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
                      </div>

                      <div className="border-t border-zinc-100 dark:border-zinc-800/60 pt-4 space-y-2.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Account Username:</span>
                          <span className="font-semibold">{user.mobile}@mtos-org.com</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Primary Country:</span>
                          <span className="font-semibold">{user.country}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Secure Token:</span>
                          <span className="font-mono text-[10px] bg-zinc-50 dark:bg-zinc-950 p-1 rounded max-w-[120px] truncate" title={user.token}>
                            {user.token}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-xl shadow-xs lg:col-span-2 space-y-4">
                      <div>
                        <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                          Storage Allocation Settings
                        </h3>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">View and adjust storage configurations on your personal account.</p>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div className="bg-blue-500/5 p-4 rounded-lg border border-blue-500/10 space-y-2">
                          <h4 className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <Sparkles className="h-4 w-4" />
                            Free Account Plan
                          </h4>
                          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-[11px]">
                            Your drive space is hosted on the MTOS strong container sandbox tier. This tier supports standard folder management, custom category indexes, real-time file searching, and holds a size limit of 100 MB.
                          </p>
                        </div>

                        <div className="space-y-2.5">
                          <div className="flex justify-between font-semibold">
                            <span>Storage space consumption</span>
                            <span>{stats.percent.toFixed(2)}% used</span>
                          </div>
                          <div className="h-2.5 bg-zinc-100 dark:bg-zinc-950 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-850">
                            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${stats.percent}%` }} />
                          </div>
                          <div className="flex justify-between text-[11px] text-zinc-500">
                            <span>{formatSize(stats.totalSize)} occupied</span>
                            <span>{formatSize(STORAGE_LIMIT - stats.totalSize)} remaining</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Operational logs */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-xs space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                        Drive Sync Operation Logs
                      </h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Live operational events triggered by your drive storage writes & deletes.</p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-sans">
                        <thead>
                          <tr className="bg-zinc-50 dark:bg-zinc-900/40 border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 font-bold">
                            <th className="p-2.5 pl-4">Operation ID</th>
                            <th className="p-2.5">Action Event</th>
                            <th className="p-2.5 text-right pr-4">Timestamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/40">
                          {billingLogs.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="py-8 text-center text-zinc-400 italic">No sync logs parsed yet.</td>
                            </tr>
                          ) : (
                            [...billingLogs].reverse().map((log) => (
                              <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 transition-colors">
                                <td className="p-2.5 pl-4 font-mono text-[10px] text-zinc-400 truncate max-w-[120px]" title={log.id}>
                                  {log.id}
                                </td>
                                <td className="p-2.5 font-semibold text-zinc-700 dark:text-zinc-300">
                                  {log.action}
                                </td>
                                <td className="p-2.5 text-right text-zinc-500 font-mono text-[11px] pr-4">
                                  {log.timestamp}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {/* DIALOGS / OVERLAYS */}

      {/* 1. Create folder modal */}
      <AnimatePresence>
        {isCreateFolderOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-sm rounded-xl p-6 shadow-xl space-y-4"
            >
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Create Virtual Folder</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">Define a directory tag to segment uploaded files.</p>
              </div>

              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g. Legal Documents"
                className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-blue-500"
                autoFocus
              />

              <div className="flex justify-end gap-2 text-xs pt-1">
                <button
                  onClick={() => {
                    setIsCreateFolderOpen(false);
                    setNewFolderName('');
                  }}
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 font-bold rounded-lg cursor-pointer text-zinc-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!newFolderName.trim()) {
                      addAlert('Folder name is required.', 'error');
                      return;
                    }
                    const ok = await createFolder(newFolderName.trim());
                    if (ok) {
                      setIsCreateFolderOpen(false);
                      setNewFolderName('');
                    }
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg cursor-pointer"
                >
                  Create Folder
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Inline renaming file modal */}
      <AnimatePresence>
        {renamingFileId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-sm rounded-xl p-6 shadow-xl space-y-4"
            >
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Rename File Asset</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">Type in a new descriptive name for your storage asset.</p>
              </div>

              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="filename.ext"
                className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-blue-500"
                autoFocus
              />

              <div className="flex justify-end gap-2 text-xs pt-1">
                <button
                  onClick={() => {
                    setRenamingFileId(null);
                    setRenameValue('');
                  }}
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 font-bold rounded-lg cursor-pointer text-zinc-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!renameValue.trim()) {
                      addAlert('Name cannot be empty.', 'error');
                      return;
                    }
                    const ok = await renameFile(renamingFileId, renameValue.trim());
                    if (ok) {
                      setRenamingFileId(null);
                      setRenameValue('');
                    }
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg cursor-pointer"
                >
                  Apply Rename
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Move File to Folder modal */}
      <AnimatePresence>
        {isMoveFolderOpen && movingFile && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-xl p-6 shadow-xl space-y-4"
            >
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Move Asset Directory</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Select a destination folder for <strong className="text-zinc-700 dark:text-zinc-350 font-bold">“{movingFile.name}”</strong>.
                </p>
              </div>

              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pt-1">
                {/* Root Option */}
                <button
                  onClick={async () => {
                    const ok = await moveFile(movingFile.id, null);
                    if (ok) setIsMoveFolderOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-2 ${
                    movingFile.folderId === null
                      ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/15 text-blue-600'
                      : 'border-zinc-100 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-950'
                  }`}
                >
                  <HardDrive className="h-4 w-4 shrink-0 text-blue-500" />
                  My Drive Root (Unassigned)
                </button>

                {folders.map((f) => (
                  <button
                    key={f.id}
                    onClick={async () => {
                      const ok = await moveFile(movingFile.id, f.id);
                      if (ok) setIsMoveFolderOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-2 ${
                      movingFile.folderId === f.id
                        ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/15 text-blue-600'
                        : 'border-zinc-100 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-950'
                    }`}
                  >
                    <Folder className="h-4 w-4 shrink-0 text-blue-500 fill-current" />
                    {f.name}
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => {
                    setIsMoveFolderOpen(false);
                    setMovingFile(null);
                  }}
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-xs font-bold rounded-lg cursor-pointer text-zinc-700 dark:text-zinc-300"
                >
                  Close Options
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Details Modal */}
      <AnimatePresence>
        {selectedCategory && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-4 flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-850 pb-4 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    {selectedCategory === 'Images' && <FileImage className="h-5 w-5" />}
                    {selectedCategory === 'Documents' && <FileText className="h-5 w-5" />}
                    {selectedCategory === 'Media Files' && <FileVideo className="h-5 w-5" />}
                    {selectedCategory === 'Others & Archives' && <File className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">{selectedCategory} Category Files</h3>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Explore, download, and manage your physically synced {selectedCategory.toLowerCase()}.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="hover:bg-zinc-100 dark:hover:bg-zinc-850 p-1.5 rounded-lg text-zinc-400 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable List content */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1 animate-fadeIn">
                {getCategoryFiles(selectedCategory).length === 0 ? (
                  <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center text-zinc-400 border border-zinc-100 dark:border-zinc-850">
                      <Cloud className="h-5 w-5 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">No category assets found</h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-xs mt-0.5">
                        Upload some files in this format to index them under {selectedCategory.toLowerCase()}.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-850/60">
                    {getCategoryFiles(selectedCategory).map((file) => (
                      <div
                        key={file.id}
                        className="py-3 flex items-center justify-between gap-4 group hover:bg-zinc-50 dark:hover:bg-zinc-950 px-2.5 rounded-xl transition-all"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="bg-zinc-100 dark:bg-zinc-950 p-2 rounded-lg border border-zinc-200/50 dark:border-zinc-850">
                            {getFileIcon(file.type)}
                          </div>
                          <div className="overflow-hidden leading-tight">
                            <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate" title={file.name}>
                              {file.name}
                            </h4>
                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-1">
                              {formatSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => triggerDownload(file)}
                            className="p-2 rounded-lg hover:bg-blue-500/10 text-zinc-400 hover:text-blue-500 transition-colors cursor-pointer"
                            title="Download Asset"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={async () => {
                              const conf = confirm(`Are you sure you want to permanently delete "${file.name}"?`);
                              if (conf) {
                                await deleteFile(file.id, true);
                              }
                            }}
                            className="p-2 rounded-lg hover:bg-rose-500/10 text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
                            title="Delete Asset"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end border-t border-zinc-150 dark:border-zinc-850 pt-4 shrink-0">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-xs font-bold rounded-lg cursor-pointer text-zinc-700 dark:text-zinc-300"
                >
                  Close View
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Detail Side Drawer Panel */}
      <AnimatePresence>
        {selectedFile && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 flex justify-end">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={() => setSelectedFile(null)} />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-sm bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl h-full flex flex-col z-50"
            >
              {/* Drawer Header */}
              <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/40">
                <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">File Metadata</h3>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="hover:bg-zinc-200 dark:hover:bg-zinc-800 p-1 rounded-lg text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                {/* Visual Category Icon Box */}
                <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl py-12 flex items-center justify-center border border-zinc-100 dark:border-zinc-850">
                  <div className="scale-125">{getFileIcon(selectedFile.type)}</div>
                </div>

                {/* Details */}
                <div className="space-y-4">
                  <div>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest font-mono">File Name</span>
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100 break-all mt-0.5">{selectedFile.name}</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest font-mono">File Size</span>
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100 mt-0.5">{formatSize(selectedFile.size)}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Folder Location</span>
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100 mt-0.5">
                        {selectedFile.folderId ? (
                          <span className="text-blue-500 font-bold">
                            {folders.find(f => f.id === selectedFile.folderId)?.name}
                          </span>
                        ) : 'My Drive (Root)'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Mime Type</span>
                      <p className="text-[10.5px] font-mono text-zinc-600 dark:text-zinc-350 break-all mt-0.5">{selectedFile.type || 'Unknown'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest font-mono">Uploaded Date</span>
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100 mt-0.5">{new Date(selectedFile.uploadedAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Action Bar */}
              <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 grid grid-cols-2 gap-2">
                <button
                  onClick={() => triggerDownload(selectedFile)}
                  className="py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" /> Download File
                </button>
                <button
                  onClick={() => copyShareLink(selectedFile)}
                  className="py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" /> Share Asset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
