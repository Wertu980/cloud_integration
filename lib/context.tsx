'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Theme type
export type Theme = 'light' | 'dark';

// Alert type
export interface AlertMessage {
  text: string;
  type: 'success' | 'error' | 'info';
  id: string;
}

// User type
export interface UserProfile {
  name: string;
  email: string;
  mobile: string;
  country: string;
  token: string;
}

// File Metadata type
export interface CloudFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  folderId?: string | null;
  isStarred?: boolean;
  isTrashed?: boolean;
}

// Folder type
export interface CloudFolder {
  id: string;
  name: string;
  createdAt: string;
}

// Billing Log type
export interface BillingLog {
  id: string;
  action: string;
  timestamp: string;
  cost?: number;
  ip?: string;
  [key: string]: any;
}

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  
  // Loading states
  authLoading: boolean;
  uploadLoading: boolean;
  listLoading: boolean;
  logsLoading: boolean;

  // Data states
  files: CloudFile[];
  folders: CloudFolder[];
  billingLogs: BillingLog[];
  quota: { total: number; used: number; free: number } | null;
  
  // Alert logs
  alerts: AlertMessage[];
  addAlert: (text: string, type: 'success' | 'error' | 'info') => void;
  removeAlert: (id: string) => void;

  // Auth Operations
  signUp: (data: any) => Promise<boolean>;
  logIn: (data: any) => Promise<boolean>;
  logOut: () => void;

  // File Operations
  uploadFile: (file: File, folderId?: string | null) => Promise<boolean>;
  fetchFiles: () => Promise<void>;
  deleteFile: (fileId: string, permanent: boolean) => Promise<boolean>;
  restoreFile: (fileId: string) => Promise<boolean>;
  toggleStar: (fileId: string, isStarred: boolean) => Promise<boolean>;
  renameFile: (fileId: string, name: string) => Promise<boolean>;
  moveFile: (fileId: string, folderId: string | null) => Promise<boolean>;

  // Folder Operations
  fetchFolders: () => Promise<void>;
  createFolder: (name: string) => Promise<boolean>;
  deleteFolder: (folderId: string) => Promise<boolean>;

  // Log Operations
  fetchBillingLogs: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

let alertCounter = 0;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // State Management
  const [authLoading, setAuthLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);

  const [files, setFiles] = useState<CloudFile[]>([]);
  const [folders, setFolders] = useState<CloudFolder[]>([]);
  const [billingLogs, setBillingLogs] = useState<BillingLog[]>([]);
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);
  const [quota, setQuota] = useState<{ total: number; used: number; free: number } | null>(null);

  // Alert Manager
  const addAlert = (text: string, type: 'success' | 'error' | 'info') => {
    const id = `alert-${alertCounter++}`;
    setAlerts((prev) => [...prev, { text, type, id }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      removeAlert(id);
    }, 5000);
  };

  const removeAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  // Helper with direct token for immediate loads
  const fetchFilesByToken = async (activeToken: string) => {
    setListLoading(true);
    try {
      const res = await fetch('/api/proxy/files/list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${activeToken}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to retrieve file index.');
      }

      const fileData = await res.json();
      const rawFiles = Array.isArray(fileData) ? fileData : (fileData.files || fileData.data || []);
      setFiles(rawFiles);
      if (fileData && fileData.quota) {
        setQuota(fileData.quota);
      }
    } catch (err: any) {
      console.error(err);
      addAlert('Failed to index your cloud files.', 'error');
    } finally {
      setListLoading(false);
    }
  };

  const fetchFoldersByToken = async (activeToken: string) => {
    try {
      const res = await fetch('/api/proxy/folders/list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${activeToken}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to retrieve folders.');
      }

      const folderData = await res.json();
      setFolders(Array.isArray(folderData) ? folderData : []);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchBillingLogsByToken = async (activeToken: string) => {
    setLogsLoading(true);
    try {
      const res = await fetch('/api/proxy/billing/logs', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${activeToken}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to retrieve activity logs.');
      }

      const logsData = await res.json();
      const rawLogs = Array.isArray(logsData) ? logsData : (logsData.logs || logsData.data || []);
      setBillingLogs(rawLogs);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLogsLoading(false);
    }
  };

  // Load state from localStorage once mounted
  useEffect(() => {
    const savedTheme = localStorage.getItem('mtos-theme') as Theme;
    const savedUser = localStorage.getItem('mtos-user');

    const timer = setTimeout(() => {
      if (savedTheme) {
        setTheme(savedTheme);
      } else {
        const systemTheme = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        setTheme(systemTheme);
      }

      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          // Hydrate data immediately
          fetchFilesByToken(parsedUser.token);
          fetchFoldersByToken(parsedUser.token);
          fetchBillingLogsByToken(parsedUser.token);
        } catch (e) {
          localStorage.removeItem('mtos-user');
        }
      }

      setIsMounted(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Sync theme class with document element
  useEffect(() => {
    if (!isMounted) return;
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('mtos-theme', theme);
  }, [theme, isMounted]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Auth Operations
  const signUp = async (data: any): Promise<boolean> => {
    setAuthLoading(true);
    try {
      const res = await fetch('/api/proxy/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signup',
          name: data.name,
          mobile: data.mobile,
          country: data.country,
          password: data.password,
          email: data.email,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.message || resData.error || 'Failed to sign up.');
      }

      addAlert('Drive account created successfully! Your login email is: ' + data.email, 'success');
      setAuthLoading(false);
      return true;
    } catch (err: any) {
      addAlert(err.message || 'Error occurred during registration.', 'error');
      setAuthLoading(false);
      return false;
    }
  };

  const logIn = async (data: any): Promise<boolean> => {
    setAuthLoading(true);
    try {
      const res = await fetch('/api/proxy/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: data.email,
          password: data.password,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.message || resData.error || 'Authentication failed. Please check credentials.');
      }

      const token = resData.token || resData.jwt || resData.accessToken || '';
      if (!token) {
        throw new Error('Authentication did not return a valid secure token.');
      }

      const parsedUser: UserProfile = {
        name: resData.user?.name || resData.name || 'Cloud User',
        email: data.email,
        mobile: resData.user?.mobile || resData.mobile || data.email.split('@')[0],
        country: resData.user?.country || resData.country || 'Global',
        token: token,
      };

      setUser(parsedUser);
      localStorage.setItem('mtos-user', JSON.stringify(parsedUser));
      addAlert('Logged in successfully. Welcome, ' + parsedUser.name + '!', 'success');
      
      setAuthLoading(false);
      
      // Load user drive assets
      setTimeout(() => {
        fetchFilesByToken(token);
        fetchFoldersByToken(token);
        fetchBillingLogsByToken(token);
      }, 100);

      return true;
    } catch (err: any) {
      addAlert(err.message || 'Failed to sign in.', 'error');
      setAuthLoading(false);
      return false;
    }
  };

  const logOut = () => {
    setUser(null);
    setFiles([]);
    setFolders([]);
    setBillingLogs([]);
    localStorage.removeItem('mtos-user');
    addAlert('Logged out successfully.', 'info');
  };

  // Files Fetch
  const fetchFiles = async () => {
    if (!user) return;
    await fetchFilesByToken(user.token);
  };

  // Folders Fetch
  const fetchFolders = async () => {
    if (!user) return;
    await fetchFoldersByToken(user.token);
  };

  // Billing Logs Fetch
  const fetchBillingLogs = async () => {
    if (!user) return;
    await fetchBillingLogsByToken(user.token);
  };

  // Create Folder
  const createFolder = async (name: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch('/api/proxy/folders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create folder');
      }

      addAlert(`Folder "${name}" created successfully.`, 'success');
      await fetchFolders();
      await fetchBillingLogs();
      return true;
    } catch (err: any) {
      addAlert(err.message || 'Error creating folder.', 'error');
      return false;
    }
  };

  // Delete Folder
  const deleteFolder = async (folderId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch('/api/proxy/folders/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({ folderId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to delete folder');
      }

      addAlert('Folder deleted. Inner files returned to My Drive root.', 'success');
      await fetchFolders();
      await fetchFiles();
      await fetchBillingLogs();
      return true;
    } catch (err: any) {
      addAlert(err.message || 'Error deleting folder.', 'error');
      return false;
    }
  };

  // Upload File
  const uploadFile = async (file: File, folderId: string | null = null): Promise<boolean> => {
    if (!user) {
      addAlert('Authentication required to upload files.', 'error');
      return false;
    }

    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (folderId) {
        formData.append('folderId', folderId);
      }

      const res = await fetch('/api/proxy/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to upload file.');
      }

      addAlert(`"${file.name}" uploaded successfully.`, 'success');
      await fetchFiles();
      await fetchBillingLogs();
      return true;
    } catch (err: any) {
      addAlert(err.message || `Failed to upload "${file.name}".`, 'error');
      return false;
    } finally {
      setUploadLoading(false);
    }
  };

  // Delete/Trash File
  const deleteFile = async (fileId: string, permanent: boolean): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch('/api/proxy/files/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({ fileId, permanent }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to delete file');
      }

      addAlert(permanent ? 'File deleted permanently.' : 'File moved to Trash.', 'success');
      await fetchFiles();
      await fetchBillingLogs();
      return true;
    } catch (err: any) {
      addAlert(err.message || 'Error deleting file.', 'error');
      return false;
    }
  };

  // Restore File
  const restoreFile = async (fileId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch('/api/proxy/files/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({ fileId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to restore file');
      }

      addAlert('File restored to active storage.', 'success');
      await fetchFiles();
      await fetchBillingLogs();
      return true;
    } catch (err: any) {
      addAlert(err.message || 'Error restoring file.', 'error');
      return false;
    }
  };

  // Toggle Star
  const toggleStar = async (fileId: string, isStarred: boolean): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch('/api/proxy/files/star', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({ fileId, isStarred }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to star/unstar file');
      }

      await fetchFiles();
      return true;
    } catch (err: any) {
      addAlert(err.message || 'Error updating starred status.', 'error');
      return false;
    }
  };

  // Rename File
  const renameFile = async (fileId: string, name: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch('/api/proxy/files/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({ fileId, name }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to rename file');
      }

      addAlert('File renamed successfully.', 'success');
      await fetchFiles();
      await fetchBillingLogs();
      return true;
    } catch (err: any) {
      addAlert(err.message || 'Error renaming file.', 'error');
      return false;
    }
  };

  // Move File Folder
  const moveFile = async (fileId: string, folderId: string | null): Promise<boolean> => {
    if (!user) return false;
    try {
      const res = await fetch('/api/proxy/files/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify({ fileId, folderId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to move file');
      }

      addAlert('File moved successfully.', 'success');
      await fetchFiles();
      await fetchBillingLogs();
      return true;
    } catch (err: any) {
      addAlert(err.message || 'Error moving file.', 'error');
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        user,
        setUser,
        authLoading,
        uploadLoading,
        listLoading,
        logsLoading,
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
        fetchFolders,
        createFolder,
        deleteFolder,
        fetchBillingLogs,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
