import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; }>;
  signUp: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string; }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        throw new Error('Failed to fetch user profile');
      }
      
      if (!data || !data.role || !['admin', 'staff'].includes(data.role)) {
        throw new Error('Invalid user role');
      }
      
      return data.role as 'admin' | 'staff';
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const role = await fetchUserProfile(session.user.id);
          
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: role,
          });
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const role = await fetchUserProfile(session.user.id);
            
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              role: role,
            });
          } catch (error) {
            console.error('Error during auth state change:', error);
            setUser(null);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('No user data returned after sign in');
      }

      try {
        const role = await fetchUserProfile(authData.user.id);
        
        setUser({
          id: authData.user.id,
          email: authData.user.email || '',
          role: role,
        });
        
        return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message
      };
      }
    } catch {
      return { 
        success: false, 
        error: 'An error occurred during sign in' 
      };
    }
  };
 
  const signUp = async (name: string, email: string, password: string) => {
    console.log('Starting direct XHR signup');
    
    return new Promise((resolve) => {
      // Function to create profile after user is created
      const createProfile = async (userId: string, email: string) => {
        console.log('Creating profile for user:', userId);
        
        // Create a new XHR request for profile creation
        const profileXhr = new XMLHttpRequest();
        profileXhr.open('POST', 'https://zfjclokknvuzurgccrit.supabase.co/rest/v1/profiles');
        profileXhr.setRequestHeader('apikey', import.meta.env.VITE_SUPABASE_ANON_KEY || '');
        profileXhr.setRequestHeader('Content-Type', 'application/json');
        profileXhr.setRequestHeader('Prefer', 'return=minimal');
        
        profileXhr.onload = function() {
          if (profileXhr.status >= 200 && profileXhr.status < 300) {
            console.log('Profile created successfully');
            resolve({ success: true });
          } else {
            console.error('Profile creation failed:', profileXhr.responseText);
            resolve({ success: false, error: 'Failed to create profile' });
          }
        };
        
        profileXhr.onerror = function() {
          console.error('Profile XHR error');
          resolve({ success: false, error: 'Network error during profile creation' });
        };
        
        profileXhr.send(JSON.stringify({
          id: userId,
          role: 'staff'
        }));

        setUser({
          id: userId,
          email: email,
          role: 'staff',
        });
      };
      
      // Create a new XHR request
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://zfjclokknvuzurgccrit.supabase.co/auth/v1/signup');
      xhr.setRequestHeader('apikey', import.meta.env.VITE_SUPABASE_ANON_KEY || '');
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      xhr.onload = function() {
        console.log('XHR completed with status:', xhr.status);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('Auth response:', response);
            
            if (response.user && response.user.id) {
              // User created successfully
              createProfile(response.user.id);
            } else {
              console.error('Auth response missing user data');
              resolve({ success: false, error: 'Invalid response from server' });
            }
          } catch (e) {
            console.error('Error parsing response:', e);
            resolve({ success: false, error: 'Failed to parse server response' });
          }
        } else {
          console.error('Auth request failed:', xhr.responseText);
          resolve({ success: false, error: 'Authentication failed' });
        }
      };
      
      xhr.onerror = function() {
        console.error('XHR error');
        resolve({ success: false, error: 'Network error during signup' });
      };
      
      xhr.ontimeout = function() {
        console.error('XHR timed out');
        resolve({ success: false, error: 'Request timed out' });
      };
      
      // Set timeout to 10 seconds
      xhr.timeout = 10000;
      
      // Send the request
      console.log('Sending XHR request');
      xhr.send(JSON.stringify({
        email,
        password,
        data: {
          name
        }
      }));
      
      console.log('XHR request sent');
    });
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
