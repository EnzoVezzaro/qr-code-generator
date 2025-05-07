import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types'; // Assuming User type is defined here or imported

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; }>;
  signUp: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string; }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the hook before the provider component
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = (userId: string): Promise<'admin' | 'staff'> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase environment variables');
        reject(new Error('Missing Supabase configuration'));
        return;
      }

      const url = `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=role`;

      xhr.open('GET', url);
      xhr.setRequestHeader('apikey', supabaseAnonKey);
      xhr.setRequestHeader('Prefer', 'return=representation');
      xhr.setRequestHeader('Content-Type', 'application/json');

      xhr.onload = function() {
        console.log('fetchUserProfile XHR completed with status:', xhr.status);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('fetchUserProfile response:', response);

            if (Array.isArray(response) && response.length > 0) {
              const profile = response[0];
              if (profile && profile.role && ['admin', 'staff'].includes(profile.role)) {
                resolve(profile.role as 'admin' | 'staff');
              } else {
                console.error('Invalid user role in profile');
                reject(new Error('Invalid user role'));
              }
            } else {
              console.error('Profile not found or invalid response');
              reject(new Error('Profile not found'));
            }
          } catch (e: unknown) {
            console.error('Error parsing fetchUserProfile response:', e);
            reject(new Error('Failed to parse server response'));
          }
        } else {
          console.error('fetchUserProfile request failed:', xhr.responseText);
          reject(new Error(`Failed to fetch user profile: ${xhr.status} ${xhr.statusText}`));
        }
      };

      xhr.onerror = function() {
        console.error('fetchUserProfile XHR error');
        reject(new Error('Network error during profile fetch'));
      };

      xhr.ontimeout = function() {
        console.error('fetchUserProfile XHR timed out');
        reject(new Error('Request timed out'));
      };

      xhr.send();
    });
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log('here here');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('here 1: ', session);
        
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
    return new Promise(resolve => {
      const xhr = new XMLHttpRequest();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase environment variables');
        resolve({ success: false, error: 'Missing Supabase configuration' });
        return;
      }

      xhr.open('POST', `${supabaseUrl}/auth/v1/token?grant_type=password`);
      xhr.setRequestHeader('apikey', supabaseAnonKey);
      xhr.setRequestHeader('Content-Type', 'application/json');

      xhr.onload = function() {
        console.log('SignIn XHR completed with status:', xhr.status);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('SignIn Auth response:', response);

            if (response.user && response.access_token) {
              // Store session manually (Supabase client usually handles this)
              // For XHR, we might need to store the token and user data
              // For simplicity here, we'll just use the user data for context state
              // A more robust solution would involve storing the token in local storage
              // and setting it in subsequent XHR requests.

              // Fetch user profile after successful authentication
              fetchUserProfile(response.user.id)
                .then(role => {
                  setUser({
                    id: response.user.id,
                    email: response.user.email || '',
                    role: role,
                  });
                  resolve({ success: true });
                })
                .catch(profileError => {
                  console.error('Error fetching profile after signin:', profileError);
                  const errorMessage = (profileError instanceof Error) ? profileError.message : 'Failed to fetch user profile';
                  resolve({ success: false, error: errorMessage });
                });

            } else {
              console.error('Auth response missing user data or token');
              resolve({ success: false, error: 'Invalid response from server' });
            }
          } catch (e: unknown) { // Changed any to unknown
            console.error('Error parsing signin response:', e);
            resolve({ success: false, error: 'Failed to parse server response' });
          }
        } else {
          console.error('SignIn Auth request failed:', xhr.responseText);
          let errorMessage = 'Authentication failed';
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            if (errorResponse.error_description) {
              errorMessage = errorResponse.error_description;
            } else if (errorResponse.msg) {
               errorMessage = errorResponse.msg;
            }
          } catch (parseError) { // Use a different variable name
            console.error('Error parsing signin error response:', parseError); // Log parsing error
            // Ignore parsing error if response is not JSON, keep generic message
          }
          resolve({ success: false, error: errorMessage });
        }
      };

      xhr.onerror = function() {
        console.error('SignIn XHR error');
        resolve({ success: false, error: 'Network error during sign in' });
      };

      xhr.ontimeout = function() {
        console.error('SignIn XHR timed out');
        resolve({ success: false, error: 'Request timed out' });
      };

      // Set timeout (e.g., 15 seconds)
      xhr.timeout = 15000;

      // Send the request
      console.log('Sending SignIn XHR request');
      xhr.send(JSON.stringify({
        email,
        password,
      }));
    }) as Promise<{ success: boolean; error?: string; }>; // Explicitly type the Promise resolve
  };
 
  const signUp = async (name: string, email: string, password: string) => {
    console.log('Starting direct XHR signup');
    
    return new Promise(resolve => {
      const xhr = new XMLHttpRequest();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase environment variables');
        resolve({ success: false, error: 'Missing Supabase configuration' });
        return;
      }

      xhr.open('POST', `${supabaseUrl}/auth/v1/signup`); // Use environment variable
      xhr.setRequestHeader('apikey', supabaseAnonKey); // Use environment variable
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      xhr.onload = function() {
        console.log('SignUp XHR completed with status:', xhr.status);
        
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('SignUp Auth response:', response);
            
            if (response.user && response.user.id) {
              // User created successfully, now create profile
              const profileXhr = new XMLHttpRequest();
              profileXhr.open('POST', `${supabaseUrl}/rest/v1/profiles`); // Use environment variable
              profileXhr.setRequestHeader('apikey', supabaseAnonKey); // Use environment variable
              profileXhr.setRequestHeader('Content-Type', 'application/json');
              profileXhr.setRequestHeader('Prefer', 'return=minimal');
              
              profileXhr.onload = function() {
                if (profileXhr.status >= 200 && profileXhr.status < 300) {
                  console.log('Profile created successfully');
                  // User state will be set by onAuthStateChange listener upon successful signup
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
                id: response.user.id,
                role: 'staff' // Default new users to 'staff' role
              }));

            } else {
              console.error('Auth response missing user data');
              resolve({ success: false, error: 'Invalid response from server' });
            }
          } catch (e: unknown) { // Changed any to unknown
            console.error('Error parsing signup response:', e);
            resolve({ success: false, error: 'Failed to parse server response' });
          }
        } else {
          console.error('SignUp Auth request failed:', xhr.responseText);
           let errorMessage = 'Authentication failed';
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            if (errorResponse.error_description) {
              errorMessage = errorResponse.error_description;
            } else if (errorResponse.msg) {
               errorMessage = errorResponse.msg;
            }
          } catch (parseError) { // Use a different variable name
             console.error('Error parsing signup error response:', parseError); // Log parsing error
            // Ignore parsing error if response is not JSON
          }
          resolve({ success: false, error: errorMessage });
        }
      };
      
      xhr.onerror = function() {
        console.error('SignUp XHR error');
        resolve({ success: false, error: 'Network error during signup' });
      };
      
      xhr.ontimeout = function() {
        console.error('SignUp XHR timed out');
        resolve({ success: false, error: 'Request timed out' });
      };
      
      // Set timeout to 15 seconds
      xhr.timeout = 15000;
      
      // Send the request
      console.log('Sending SignUp XHR request');
      xhr.send(JSON.stringify({
        email,
        password,
        data: {
          name
        }
      }));
    }) as Promise<{ success: boolean; error?: string; }>; // Explicitly type the Promise resolve
  };

  const signOut = async () => {
    // Refactor to use XHR
    return new Promise<void>(resolve => { // Removed async from executor
      const xhr = new XMLHttpRequest();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      // Get current session using Supabase client method
      supabase.auth.getSession().then(({ data: { session } }) => {
        const accessToken = session?.access_token;

        if (!supabaseUrl || !supabaseAnonKey || !accessToken) {
           console.error('Missing Supabase configuration or access token for sign out');
           setUser(null); // Clear user state locally even if no token
           resolve(); // Resolve without error, as sign out just clears local state
           return;
        }

        xhr.open('POST', `${supabaseUrl}/auth/v1/logout`);
        xhr.setRequestHeader('apikey', supabaseAnonKey);
        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
      xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.onload = function() {
          console.log('SignOut XHR completed with status:', xhr.status);
          // Supabase logout endpoint returns 204 on success
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log('Signed out successfully via XHR');
            setUser(null); // Clear user state locally
            resolve();
          } else {
            console.error('SignOut XHR failed:', xhr.responseText);
            // Even on failure, we might want to clear local state
            setUser(null);
            resolve(); // Resolve the promise
          }
        };

        xhr.onerror = function() {
          console.error('SignOut XHR error');
          setUser(null); // Clear user state locally
          resolve(); // Resolve the promise
        };

        xhr.ontimeout = function() {
          console.error('SignOut XHR timed out');
          setUser(null); // Clear user state locally
          resolve(); // Resolve the promise
        };

        xhr.timeout = 15000;

        console.log('Sending SignOut XHR request');
        xhr.send(); // POST request with no body
      }).catch(error => {
        console.error('Error getting session for sign out:', error);
        setUser(null); // Clear user state locally
        resolve(); // Resolve the promise
      });
    });
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
