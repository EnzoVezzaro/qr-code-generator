import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; }>;
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

      // simulate login
      setUser({
        id: 'a1507a58-2146-4d45-9214-603237dfc558',
        email: 'admin@exmaple.com' || '',
        role: 'admin',
      });
      
      return { success: true };

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

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
      } catch (profileError: any) {
        // If we can't fetch the profile, sign out the user
        await supabase.auth.signOut();
        return { 
          success: false, 
          error: 'Unable to access user profile. Please contact support.' 
        };
      }
    } catch (error: any) {
      console.error('Error signing in:', error);
      return { 
        success: false, 
        error: error.message || 'An error occurred during sign in' 
      };
    }
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