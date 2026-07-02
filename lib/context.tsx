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
  name: string;
  size?: number;
  type?: string;
  uploadedAt?: string;
  id?: string;
  [key: string]: any; // To support any dynamic properties returned by backend logs
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
  keyLoading: boolean;
  logsLoading: boolean;

  // Data states
  files: CloudFile[];
  apiKey: string | null;
  billingLogs: BillingLog[];
  
  // Alert logs
  alerts: AlertMessage[];
  addAlert: (text: string, type: 'success' | 'error' | 'info') => void;
  removeAlert: (id: string) => void;

  // Auth Operations
  signUp: (data: any) => Promise<boolean>;
  logIn: (data: any) => Promise<boolean>;
  logOut: () => void;

  // File Operations
  uploadFile: (file: File) => Promise<boolean>;
  fetchFiles: () => Promise<void>;

  // Billing Operations
  generateApiKey: () => Promise<string | null>;
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
  const [keyLoading, setKeyLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);

  const [files, setFiles] = useState<CloudFile[]>([]);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [billingLogs, setBillingLogs] = useState<BillingLog[]>([]);
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);

  // Load state from localStorage once mounted
  useEffect(() => {
    const savedTheme = localStorage.getItem('mtos-theme') as Theme;
    const savedUser = localStorage.getItem('mtos-user');
    const savedApiKey = localStorage.getItem('mtos-apikey');

    const timer = setTimeout(() => {
      if (savedTheme) {
        setTheme(savedTheme);
      } else {
        const systemTheme = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        setTheme(systemTheme);
      }

      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          localStorage.removeItem('mtos-user');
        }
      }

      if (savedApiKey) {
        setApiKey(savedApiKey);
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

  // Auth Operations
  const signUp = async (data: any): Promise<boolean> => {
    setAuthLoading(true);
    try {
      const res = await fetch('/api/proxy/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          mobile: data.mobile,
          country: data.country,
          password: data.password,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.message || resData.error || 'Failed to sign up.');
      }

      addAlert('Account created successfully! Your masked username is ' + data.mobile + '@mtos-org.com', 'success');
      setAuthLoading(false);
      return true;
    } catch (err: any) {
      addAlert(err.message || 'Network error occurred during registration.', 'error');
      setAuthLoading(false);
      return false;
    }
  };

  const logIn = async (data: any): Promise<boolean> => {
    setAuthLoading(true);
    try {
      const res = await fetch('/api/proxy/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.message || resData.error || 'Authentication failed. Please check credentials.');
      }

      // Format user details. Backend returns a JWT token (frequently inside 'token' or 'jwt' or directly)
      const token = resData.token || resData.jwt || resData.accessToken || '';
      if (!token) {
        throw new Error('Authentication did not return a valid secure token.');
      }

      // Build safe local user profile
      const parsedUser: UserProfile = {
        name: resData.user?.name || resData.name || 'Cloud User',
        email: data.email,
        mobile: resData.user?.mobile || resData.mobile || data.email.split('@')[0],
        country: resData.user?.country || resData.country || 'Global',
        token: token,
      };

      setUser(parsedUser);
      localStorage.setItem('mtos-user', JSON.stringify(parsedUser));
      addAlert('Successfully authenticated. Welcome back, ' + parsedUser.name + '!', 'success');
      
      // Fetch initial user metrics
      setAuthLoading(false);
      
      // Auto-trigger load
      setTimeout(() => {
        fetchFilesByToken(token);
        fetchBillingLogsByToken(token);
      }, 100);

      return true;
    } catch (err: any) {
      addAlert(err.message || 'Network error occurred during login.', 'error');
      setAuthLoading(false);
      return false;
    }
  };

  const logOut = () => {
    setUser(null);
    setFiles([]);
    setApiKey(null);
    setBillingLogs([]);
    localStorage.removeItem('mtos-user');
    localStorage.removeItem('mtos-apikey');
    addAlert('Session terminated. You have logged out.', 'info');
  };

  // Helper with direct token for immediate loads after login
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
        throw new Error('Failed to retrieve file index from your vault.');
      }

      const fileData = await res.json();
      // Handle various response types (array or wrapped list)
      const rawFiles = Array.isArray(fileData) ? fileData : (fileData.files || fileData.data || []);
      setFiles(rawFiles);
    } catch (err: any) {
      console.error(err);
      addAlert('Failed to index your workspace files.', 'error');
    } finally {
      setListLoading(false);
    }
  };

  const fetchFiles = async () => {
    if (!user) return;
    await fetchFilesByToken(user.token);
  };

  const uploadFile = async (file: File): Promise<boolean> => {
    if (!user) {
      addAlert('Authentication required to upload files.', 'error');
      return false;
    }

    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/proxy/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Server error. Chunk writing failed.');
      }

      addAlert(`"${file.name}" uploaded successfully to your sandboxed directory.`, 'success');
      
      // Refresh list
      await fetchFiles();
      // Refresh billing logs
      await fetchBillingLogs();
      
      return true;
    } catch (err: any) {
      addAlert(err.message || `Failed to upload "${file.name}".`, 'error');
      return false;
    } finally {
      setUploadLoading(false);
    }
  };

  const generateApiKey = async (): Promise<string | null> => {
    if (!user) return null;
    setKeyLoading(true);
    try {
      const res = await fetch('/api/proxy/billing/keygen', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.message || resData.error || 'Failed to generate API Key.');
      }

      const generatedKey = resData.key || resData.apiKey || resData.hash || '';
      if (!generatedKey) {
        throw new Error('Server response did not include an API key string.');
      }

      setApiKey(generatedKey);
      localStorage.setItem('mtos-apikey', generatedKey);
      addAlert('Successfully generated persistent billing API key!', 'success');
      
      // Refresh logs
      await fetchBillingLogs();
      return generatedKey;
    } catch (err: any) {
      addAlert(err.message || 'Failed to bind static key to profile.', 'error');
      return null;
    } finally {
      setKeyLoading(false);
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
        throw new Error('Failed to retrieve billing logs.');
      }

      const logsData = await res.json();
      const rawLogs = Array.isArray(logsData) ? logsData : (logsData.logs || logsData.data || []);
      setBillingLogs(rawLogs);
    } catch (err: any) {
      console.error(err);
      addAlert('Failed to load transaction billing logs.', 'error');
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchBillingLogs = async () => {
    if (!user) return;
    await fetchBillingLogsByToken(user.token);
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
