import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, AuthState } from '../types';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../services/email';
import { useToast } from './ToastContext';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => void;
  updateProfile: (name?: string, avatarFile?: File) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const { showToast } = useToast();
  
  // Helper to load avatar
  const getUserWithAvatar = (user: User): User => {
     const avatarMap = JSON.parse(localStorage.getItem('documind_user_avatars') || '{}');
     return {
         ...user,
         avatarUrl: avatarMap[user.email]
     };
  };

  // Load user from localStorage on mount to persist session
  useEffect(() => {
    const storedUser = localStorage.getItem('documind_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Double check status on reload (optional, but good for security)
        if (parsedUser.status === 'suspended') {
           localStorage.removeItem('documind_user');
           setUser(null);
        } else {
           // Enrich with latest avatar
           setUser(getUserWithAvatar(parsedUser));
        }
      } catch (e) {
        localStorage.removeItem('documind_user');
      }
    }
  }, []);

  // Activity Heartbeat: Update last active timestamp every 30 seconds
  useEffect(() => {
    if (!user) return;

    const updateActivity = () => {
      try {
        const activityMap = JSON.parse(localStorage.getItem('documind_user_activity') || '{}');
        activityMap[user.email] = Date.now();
        localStorage.setItem('documind_user_activity', JSON.stringify(activityMap));
      } catch (e) {
        console.error("Failed to update activity", e);
      }
    };

    // Update immediately on mount/login
    updateActivity();

    // Set interval for periodic updates
    const interval = setInterval(updateActivity, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  const logAuthEvent = (email: string, action: 'LOGIN' | 'LOGOUT' | 'REGISTER' | 'RESET_REQUEST') => {
    try {
      const logs = JSON.parse(localStorage.getItem('documind_auth_logs') || '[]');
      logs.push({
        email,
        action,
        timestamp: Date.now()
      });
      localStorage.setItem('documind_auth_logs', JSON.stringify(logs));
    } catch (e) {
      console.error("Failed to save auth log", e);
    }
  };

  const login = async (email: string, password: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Hardcoded Admin Credentials
    // In a real app, this would be a backend API call
    if (email === 'harishgouda52001@gmail.com' && password === 'Aa@9141074129') {
      const adminUser: User = {
        id: '1',
        email,
        name: 'Harish Gouda',
        role: UserRole.ADMIN,
        status: 'active'
      };
      
      const enrichedAdmin = getUserWithAvatar(adminUser);
      setUser(enrichedAdmin);
      localStorage.setItem('documind_user', JSON.stringify(enrichedAdmin));
      logAuthEvent(email, 'LOGIN');
      showToast('Welcome back, Harish!', 'Admin session started successfully.', 'success');
      return;
    }

    // Check against registered users in localStorage
    const storedUsers = JSON.parse(localStorage.getItem('documind_registered_users') || '[]');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const foundUser = storedUsers.find((u: any) => u.email === email && u.password === password);
    
    if (foundUser) {
        if (foundUser.status === 'suspended') {
            throw new Error('Your account has been suspended. Please contact the administrator.');
        }

        const userObj: User = {
            id: foundUser.id,
            email: foundUser.email,
            name: foundUser.name,
            role: UserRole.USER,
            status: foundUser.status || 'active'
        };
        const enrichedUser = getUserWithAvatar(userObj);
        setUser(enrichedUser);
        localStorage.setItem('documind_user', JSON.stringify(enrichedUser));
        logAuthEvent(email, 'LOGIN');
        showToast('Welcome back!', 'You have successfully signed in.', 'success');
        return;
    }

    throw new Error('Invalid email or password');
  };

  const register = async (name: string, email: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const storedUsers = JSON.parse(localStorage.getItem('documind_registered_users') || '[]');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (storedUsers.some((u: any) => u.email === email)) {
        throw new Error('User already exists');
    }

    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password, // NOTE: Storing plain password for demo purposes only. Never do this in production.
        role: UserRole.USER,
        status: 'active'
    };
    
    storedUsers.push(newUser);
    localStorage.setItem('documind_registered_users', JSON.stringify(storedUsers));

    // Auto-login after register
    const userObj: User = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: UserRole.USER,
        status: 'active'
    };
    // No avatar on fresh register usually
    setUser(userObj);
    localStorage.setItem('documind_user', JSON.stringify(userObj));
    logAuthEvent(email, 'REGISTER');
    
    // Trigger Welcome Email (Async)
    sendWelcomeEmail(email, name).then(() => {
        showToast('Welcome Email Sent', `Sent to ${email}`, 'email');
    }).catch(e => console.error("Welcome email failed", e));

    showToast('Account Created', 'Welcome to DocuMind AI!', 'success');
  };

  const resetPassword = async (email: string) => {
    logAuthEvent(email, 'RESET_REQUEST');

    // In a real application, we would check if the user exists in the backend.
    // However, for security (to prevent user enumeration), we usually return success
    // even if the email doesn't exist, or we send a generic "if you have an account" email.
    
    // Check if it's the admin or a registered user to actually trigger the service log
    const storedUsers = JSON.parse(localStorage.getItem('documind_registered_users') || '[]');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userExists = storedUsers.some((u: any) => u.email === email) || email === 'harishgouda52001@gmail.com';

    if (userExists) {
        await sendPasswordResetEmail(email);
        // Display visual confirmation since we can't send real emails in this environment
        showToast('System Email Sent', `To: ${email} - Subject: Reset your DocuMind Password`, 'email');
    } else {
        // Simulate delay so it takes the same amount of time as a valid request
        await new Promise(resolve => setTimeout(resolve, 1500));
        // We still show success to prevent enumeration, but maybe a generic message
        showToast('Request Received', 'If an account exists, you will receive an email shortly.', 'info');
    }
  };

  const logout = () => {
    if (user) {
        logAuthEvent(user.email, 'LOGOUT');
    }
    setUser(null);
    localStorage.removeItem('documind_user');
    showToast('Signed Out', 'See you next time!', 'info');
  };

  const updateProfile = async (name?: string, avatarFile?: File) => {
    if (!user) return;
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    let newAvatarUrl = user.avatarUrl;

    if (avatarFile) {
        newAvatarUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(avatarFile);
        });
        
        const avatarMap = JSON.parse(localStorage.getItem('documind_user_avatars') || '{}');
        avatarMap[user.email] = newAvatarUrl;
        localStorage.setItem('documind_user_avatars', JSON.stringify(avatarMap));
    }
    
    const newName = name || user.name;

    // Update registered users list (for persistence across login)
    const storedUsers = JSON.parse(localStorage.getItem('documind_registered_users') || '[]');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedStoredUsers = storedUsers.map((u: any) => {
        if (u.email === user.email) {
            return { ...u, name: newName }; 
        }
        return u;
    });
    localStorage.setItem('documind_registered_users', JSON.stringify(updatedStoredUsers));

    // Update Current Session
    const updatedUser = { ...user, name: newName, avatarUrl: newAvatarUrl };
    setUser(updatedUser);
    localStorage.setItem('documind_user', JSON.stringify(updatedUser));
    
    showToast('Profile Updated', 'Your profile has been updated successfully.', 'success');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, resetPassword, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};