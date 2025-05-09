import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Participant, Event } from '@/types'; // Assuming User type is defined here or imported

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; }>;
  signUp: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string; }>;
  signOut: () => Promise<void>;
  fetchEventDetails: (eventId?: string) => Promise<{ data: Event | null; error: string | null }>;
  fetchParticipants: (eventId?: string) => Promise<{ data: Participant[] | null; error: string | null }>;
  revokeParticipantAccess: (participantId: string) => Promise<{ success: boolean; error: string | null }>;
  restoreParticipantAccess: (participantId: string) => Promise<{ success: boolean; error: string | null }>;
  updateEventXhr: (eventId: string, updateData: any) => Promise<{ success: boolean; error: string | null }>; // Added updateEventXhr
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


// Define the hook before the provider component

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

  // New function to fetch event details using XHR
  const fetchEventDetails = (eventId?: string): Promise<{ data: Event | null; error: string | null }> => {
    return new Promise(resolve => {
      const xhr = new XMLHttpRequest();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase environment variables');
        resolve({ data: null, error: 'Missing Supabase configuration' });
        return;
      }

      let url;
      if (eventId){
        url = `${supabaseUrl}/rest/v1/events?id=eq.${eventId}&select=*`;
      } else {
        url = `${supabaseUrl}/rest/v1/events?select=*`;
      }

      xhr.open('GET', url);
      xhr.setRequestHeader('apikey', supabaseAnonKey);
      xhr.setRequestHeader('Prefer', 'return=representation');
      xhr.setRequestHeader('Content-Type', 'application/json');

      xhr.onload = function() {
        console.log('fetchEventDetails XHR completed with status:', xhr.status);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('fetchEventDetails response:', response);

            if (Array.isArray(response) && response.length > 0) {
              resolve({ data: response[0] as Event, error: null });
            } else {
              console.error('Event not found or invalid response');
              resolve({ data: null, error: 'Event not found' });
            }
          } catch (e: unknown) {
            console.error('Error parsing fetchEventDetails response:', e);
            resolve({ data: null, error: 'Failed to parse server response' });
          }
        } else {
          console.error('fetchEventDetails request failed:', xhr.responseText);
          resolve({ data: null, error: `Failed to fetch event details: ${xhr.status} ${xhr.statusText}` });
        }
      };

      xhr.onerror = function() {
        console.error('fetchEventDetails XHR error');
        resolve({ data: null, error: 'Network error during event fetch' });
      };

      xhr.ontimeout = function() {
        console.error('fetchEventDetails XHR timed out');
        resolve({ data: null, error: 'Request timed out' });
      };

      xhr.send();
    });
  };

  // New function to fetch participants using XHR
  const fetchParticipants = (eventId?: string): Promise<{ data: Participant[] | null; error: string | null }> => {
    return new Promise(resolve => {
      const xhr = new XMLHttpRequest();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase environment variables');
        resolve({ data: null, error: 'Missing Supabase configuration' });
        return;
      }

      let url;
      if (eventId){
        url = `${supabaseUrl}/rest/v1/participants?event_id=eq.${eventId}&select=*&order=name.asc`;
      } else {
        url = `${supabaseUrl}/rest/v1/participants?select=*&order=name.asc`;
      }

      xhr.open('GET', url);
      xhr.setRequestHeader('apikey', supabaseAnonKey);
      xhr.setRequestHeader('Prefer', 'return=representation');
      xhr.setRequestHeader('Content-Type', 'application/json');

      xhr.onload = function() {
        console.log('fetchParticipants XHR completed with status:', xhr.status);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('fetchParticipants response:', response);

            if (Array.isArray(response)) {
              resolve({ data: response as Participant[], error: null });
            } else {
              console.error('Invalid participants response');
              resolve({ data: null, error: 'Invalid response from server' });
            }
          } catch (e: unknown) {
            console.error('Error parsing fetchParticipants response:', e);
            resolve({ data: null, error: 'Failed to parse server response' });
          }
        } else {
          console.error('fetchParticipants request failed:', xhr.responseText);
          resolve({ data: null, error: `Failed to fetch participants: ${xhr.status} ${xhr.statusText}` });
        }
      };

      xhr.onerror = function() {
        console.error('fetchParticipants XHR error');
        resolve({ data: null, error: 'Network error during participants fetch' });
      };

      xhr.ontimeout = function() {
        console.error('fetchParticipants XHR timed out');
        resolve({ data: null, error: 'Request timed out' });
      };

      xhr.send();
    });
  };

  // New function to revoke participant access using XHR
  const revokeParticipantAccess = (participantId: string): Promise<{ success: boolean; error: string | null }> => {
    return new Promise(resolve => {
      const xhr = new XMLHttpRequest();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase environment variables');
        resolve({ success: false, error: 'Missing Supabase configuration' });
        return;
      }

      const url = `${supabaseUrl}/rest/v1/participants?id=eq.${participantId}`;

      xhr.open('PATCH', url);
      xhr.setRequestHeader('apikey', supabaseAnonKey);
      xhr.setRequestHeader('Prefer', 'return=minimal'); // We don't need the updated record back
      xhr.setRequestHeader('Content-Type', 'application/json');

      xhr.onload = function() {
        console.log('revokeParticipantAccess XHR completed with status:', xhr.status);
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('Participant access revoked successfully');
          resolve({ success: true, error: null });
        } else {
          console.error('revokeParticipantAccess request failed:', xhr.responseText);
          resolve({ success: false, error: `Failed to revoke access: ${xhr.status} ${xhr.statusText}` });
        }
      };

      xhr.onerror = function() {
        console.error('revokeParticipantAccess XHR error');
        resolve({ success: false, error: 'Network error during access revocation' });
      };

      xhr.ontimeout = function() {
        console.error('revokeParticipantAccess XHR timed out');
        resolve({ success: false, error: 'Request timed out' });
      };

      xhr.send(JSON.stringify({ is_revoked: true }));
    });
  };

  // New function to restore participant access using XHR
  const restoreParticipantAccess = (participantId: string): Promise<{ success: boolean; error: string | null }> => {
    return new Promise(resolve => {
      const xhr = new XMLHttpRequest();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase environment variables');
        resolve({ success: false, error: 'Missing Supabase configuration' });
        return;
      }

      const url = `${supabaseUrl}/rest/v1/participants?id=eq.${participantId}`;

      xhr.open('PATCH', url);
      xhr.setRequestHeader('apikey', supabaseAnonKey);
      xhr.setRequestHeader('Prefer', 'return=minimal'); // We don't need the updated record back
      xhr.setRequestHeader('Content-Type', 'application/json');

      xhr.onload = function() {
        console.log('restoreParticipantAccess XHR completed with status:', xhr.status);
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('Participant access restored successfully');
          resolve({ success: true, error: null });
        } else {
          console.error('restoreParticipantAccess request failed:', xhr.responseText);
          resolve({ success: false, error: `Failed to restore access: ${xhr.status} ${xhr.statusText}` });
        }
      };

      xhr.onerror = function() {
        console.error('restoreParticipantAccess XHR error');
        resolve({ success: false, error: 'Network error during access restoration' });
      };

      xhr.ontimeout = function() {
        console.error('restoreParticipantAccess XHR timed out');
        resolve({ success: false, error: 'Request timed out' });
      };

      xhr.send(JSON.stringify({ is_revoked: false }));
    });
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
            name: (session.user.user_metadata?.name as string) || '', // Include name from user_metadata
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
              name: (session.user.user_metadata?.name as string) || '', // Include name from user_metadata
              role: role,
            });
          } catch (err: any){
            console.warn('Error login: ', err) // Corrected error to err
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase SignIn error:', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('getting info for user: ', data.user.user_metadata?.name);
        // Fetch user profile after successful authentication
        try {
          const role = await fetchUserProfile(data.user.id);
            setUser({
              id: data.user.id,
              email: data.user.email || '',
              name: (data.user.user_metadata?.name as string) || '', // Include name from user_metadata
              role: role,
            });
          return { success: true };
        } catch (profileError) {
          console.error('Error fetching profile after signin:', profileError);
          const errorMessage = (profileError instanceof Error) ? profileError.message : 'Failed to fetch user profile';
          // Even if profile fetch fails, the user is signed in according to Supabase
          // We might want to handle this case specifically in the UI
          return { success: false, error: errorMessage };
        }
      } else {
        // This case should ideally not be reached if there's no error,
        // but as a fallback
        return { success: false, error: 'Sign in failed: No user data received.' };
      }

    } catch (e: unknown) {
      console.error('Unexpected SignIn error:', e);
      const errorMessage = (e instanceof Error) ? e.message : 'An unexpected error occurred during sign in.';
      return { success: false, error: errorMessage };
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        console.error('Supabase SignUp error:', error);
        return { success: false, error: error.message };
      }

      if (data.user && data.user.id) {
        // User created successfully, now create profile
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              role: 'staff', // Default new users to 'staff' role
            });

          if (profileError) {
            console.error('Profile creation failed:', profileError);
            // Consider deleting the auth user if profile creation fails
            return { success: false, error: 'Failed to create user profile' };
          }

          // User state will be set by onAuthStateChange listener upon successful signup
          return { success: true };

        } catch (e: unknown) {
          console.error('Unexpected Profile creation error:', e);
          const errorMessage = (e instanceof Error) ? e.message : 'An unexpected error occurred during profile creation.';
          return { success: false, error: errorMessage };
        }
      } else {
         // This case might be hit if email confirmation is required
         // Supabase signUp returns user: null in that case
         // We should check data.session to be sure
         if (data.session) {
            // User signed up and signed in immediately (e.g., email confirmation off)
             return { success: true };
         } else {
            // User signed up, but needs email confirmation
            return { success: true, error: 'Please check your email to confirm your signup.' };
         }
      }

    } catch (e: unknown) {
      console.error('Unexpected SignUp error:', e);
      const errorMessage = (e instanceof Error) ? e.message : 'An unexpected error occurred during sign up.';
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase SignOut error:', error);
      } else {
        setUser(null); // Clear user state locally on successful sign out
      }
    } catch (e: unknown) {
      console.error('Unexpected SignOut error:', e);
    }
  };

  // New function to update event using XHR
  const updateEventXhr = (eventId: string, updateData: any): Promise<{ success: boolean; error: string | null }> => {
    return new Promise(async (resolve) => { // Added async here to use await for getSession
      const xhr = new XMLHttpRequest();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Get the current session to include the Authorization header
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!supabaseUrl || !supabaseAnonKey || !accessToken) {
        console.error('Missing Supabase configuration or access token for update');
        resolve({ success: false, error: 'Authentication required for this operation' });
        return;
      }

      const url = `${supabaseUrl}/rest/v1/events?id=eq.${eventId}`;

      xhr.open('PATCH', url); // Use PATCH for partial updates
      xhr.setRequestHeader('apikey', supabaseAnonKey);
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`); // Include Authorization header
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Prefer', 'return=minimal'); // We don't need the updated record back

      xhr.onload = function() {
        console.log('updateEventXhr XHR completed with status:', xhr.status);
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('Event updated successfully via XHR');
          resolve({ success: true, error: null });
        } else {
          console.error('updateEventXhr request failed:', xhr.responseText);
          let errorMessage = `Failed to update event: ${xhr.status} ${xhr.statusText}`;
           try {
            const errorResponse = JSON.parse(xhr.responseText);
            if (errorResponse.message) {
              errorMessage = errorResponse.message;
            }
          } catch (parseError) {
             console.error('Error parsing update error response:', parseError);
          }
          resolve({ success: false, error: errorMessage });
        }
      };

      xhr.onerror = function() {
        console.error('updateEventXhr XHR error');
        resolve({ success: false, error: 'Network error during event update' });
      };

      xhr.ontimeout = function() {
        console.error('updateEventXhr XHR timed out');
        resolve({ success: false, error: 'Request timed out' });
      };

      xhr.timeout = 15000; // Set timeout

      console.log('Sending updateEventXhr XHR request');
      xhr.send(JSON.stringify(updateData));
    });
  };


  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    fetchEventDetails,
    fetchParticipants,
    revokeParticipantAccess,
    restoreParticipantAccess,
    updateEventXhr, // Include the new function
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
