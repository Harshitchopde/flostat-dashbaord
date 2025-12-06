import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '@/lib/api';
import { toast } from 'sonner';
import { Org } from '@/lib/operations/orgApis';
import {  store } from '@/store';
import { setUserOrgs } from '@/slice/userSlice';
import { setToken } from '@/slice/authSlice';

interface User {
  id: string;
  email: string;
  name: string;
}

interface Organization {
  org_id: string;
  name: string;
  role: string;
}

interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  conformPassword?: string;
  contactNumber?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string,navigate: any) => Promise<boolean>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  users: User[]; // Add users array to store all users
  addUser: (user: User) => void; // Add function to add users
  devices: any[]; // Store devices
  addDevice: (device: any) => void; // Add function to add devices
  authToken: string | null; // Add authToken to context
  organizations: Org[]; // Add organizations array
  currentOrganization: Organization | null; // Add current organization
  setCurrentOrganization: (org: Organization | null) => void; // Add function to set current organization
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null); // Store auth token
  const [organizations, setOrganizations] = useState<Org[]>([]);

  // Initialize currentOrganization from localStorage
  const [currentOrganization, setCurrentOrganization] = useState<Org | null>(() => {
    const saved = localStorage.getItem('currentOrganization');
    return saved ? JSON.parse(saved) : null;
  });

  const [users, setUsers] = useState<User[]>(() => {
    // Initialize with any existing users from localStorage
    const savedUsers = localStorage.getItem('users');
    return savedUsers ? JSON.parse(savedUsers) : [];
  });
  const [devices, setDevices] = useState<any[]>(() => {
    // Initialize with any existing devices from localStorage
    const savedDevices = localStorage.getItem('devices');
    return savedDevices ? JSON.parse(savedDevices) : [];
  });

  // Persist currentOrganization to localStorage
  useEffect(() => {
    if (currentOrganization) {
      localStorage.setItem('currentOrganization', JSON.stringify(currentOrganization));
    } else {
      localStorage.removeItem('currentOrganization');
    }
  }, [currentOrganization]);

  useEffect(() => {
    // Check if user is already logged in (e.g., from localStorage)
    const unparsedToken =  localStorage.getItem('flostatToken');
    const userData = localStorage.getItem('user');
    const token = JSON.parse(unparsedToken);
    console.log("AuthContext: Initializing with stored data:", { token: !!token, userData: !!userData });

    if (token) {
      console.log("Token in auth provider: ", token)
      setAuthToken(token);
      // setUser(JSON.parse(userData));
      store.dispatch(setToken(token));
      setIsAuthenticated(true);
      // Set the token in the API service
      apiService.setAuthToken(token);

      // Fetch user organizations
      fetchUserOrganizations(token);
    } else {
      console.log("AuthContext: No stored auth data found");
    }
  }, []);

  const fetchUserOrganizations = async (token: string) => {
    try {
      console.log("AuthContext: Fetching user organizations with token:", token ? "Token present" : "No token");

      // Set the token in the API service temporarily
      apiService.setAuthToken(token);

      // Fetch user organizations
      const response = await apiService.getUserOrganizations();
      console.log("AuthContext: Organizations response:", response);

      if (response.success && response.orgs) {
        const orgs: Org[] = response.orgs;

        console.log("AuthContext: Processed organizations:", orgs);
        store.dispatch(setUserOrgs(orgs))
        setOrganizations(orgs); // Also update local state

        // Set the first organization as current if none is set
        if (orgs.length > 0 && !currentOrganization) {
          console.log("AuthContext: Setting first organization as current");
          setCurrentOrganization(orgs[0]);
        } else if (orgs.length === 0) {
          console.log("AuthContext: No organizations found for user");
          toast.info("No organizations found for your account. Please contact your administrator.");
        }
      } else {
        console.log("AuthContext: No organizations in response or response not successful");
        if (response && !response.success) {
          toast.error("Failed to fetch organizations", {
            description: response.message || "Unknown error occurred"
          });
        }
      }
    } catch (error) {
      console.error('AuthContext: Failed to fetch user organizations:', error);
      toast.error("Failed to fetch organizations", {
        description: "Please check your connection and try again"
      });
    }
  };

  const addUser = (newUser: User) => {
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
  };

  const addDevice = (newDevice: any) => {
    const updatedDevices = [...devices, newDevice];
    setDevices(updatedDevices);
    localStorage.setItem('devices', JSON.stringify(updatedDevices));
  };

  const login = async (email: string, password: string,navigate: any): Promise<boolean> => {
    try {
      console.log("AuthContext: Attempting login with:", { email, password });
      // Call the API service to authenticate the user
      const response = await apiService.login({ email, password });
      console.log("AuthContext: Login response:", response);

      if (response.success) {
        // Extract user data and token from response
        const { token, user: userData } = response;
        console.log("AuthContext: Token and user data:", { token, userData });

        // Create a simplified user object
        const userObj = {
          id: userData.id || userData.email, // Use server-provided ID if available
          email: userData.email,
          name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'User'
        };
        console.log("AuthContext: Created user object:", userObj);

        // Store token and user data
        setAuthToken(token);
        setUser(userObj);
        setIsAuthenticated(true);

        // Save to localStorage
        localStorage.setItem('flostatToken', JSON.stringify(token));
        localStorage.setItem('user', JSON.stringify(userObj));

        // Set the token in the API service for future requests
        apiService.setAuthToken(token);

        // Fetch user organizations
        console.log("AuthContext: Fetching user organizations after login");
        await fetchUserOrganizations(token);
            localStorage.setItem('user', JSON.stringify(userObj));
          store.dispatch(setToken(token));
          
          console.log("Now navigate to org")
          navigate("/organizations");
        return true;
      } else {
        console.error("AuthContext: Login failed with message:", response.message);
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      return false;
    }
  };

  const signup = async (data: SignupData): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log("AuthContext: Attempting signup with:", data);

      // Validate input data
      if (!data.email || !data.password || !data.firstName || !data.lastName) {
        throw new Error('Please fill in all required fields');
      }

      if (data.password !== data.conformPassword) {
        throw new Error('Passwords do not match');
      }

      // Call the API service to create a new user
      const response = await apiService.signUp(data);
      console.log("AuthContext: Signup response:", response);

      if (response.success) {
        // Extract user data and token from response
        const { token, user: userData } = response;
        console.log("AuthContext: Token and user data:", { token, userData });

        // Create a simplified user object
        const userObj = {
          id: userData.email, // Use email as ID for now
          email: userData.email,
          name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'User'
        };
        console.log("AuthContext: Created user object:", userObj);

        // For signup, we might not get a token immediately
        // The user would need to log in after signup
        setUser(userObj);
        // Don't set isAuthenticated to true here since they still need to log in

        // Save to localStorage
        localStorage.setItem('user', JSON.stringify(userObj));

        // Add new user to users list
        addUser(userObj);

        return { success: true };
      } else {
        console.error("AuthContext: Signup failed with message:", response.message);
        return { success: false, error: response.message || 'Signup failed' };
      }
    } catch (error: any) {
      console.error('AuthContext: Signup error:', error);

      // Handle network errors
      if (!navigator.onLine) {
        return { success: false, error: 'Network error: Please check your internet connection' };
      }

      // Handle specific API errors
      if (error.response?.status === 400) {
        return { success: false, error: 'Invalid request: ' + (error.message || 'Please check your input') };
      }

      if (error.response?.status === 409) {
        return { success: false, error: 'Conflict: ' + (error.message || 'User already exists') };
      }

      return {
        success: false,
        error: error.message || 'An unexpected error occurred during signup'
      };
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setAuthToken(null);
    setOrganizations([]);
    setCurrentOrganization(null);
    console.log("Log out run")
    localStorage.removeItem('flostatToken');
    localStorage.removeItem('user');
    localStorage.removeItem('currentOrganization');
    apiService.setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      signup,
      logout,
      isAuthenticated,
      users,
      addUser,
      devices,
      addDevice,
      authToken,
      organizations,
      currentOrganization,
      setCurrentOrganization
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}