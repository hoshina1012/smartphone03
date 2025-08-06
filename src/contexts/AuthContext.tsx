import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
  isLoggedIn: boolean;
  user: any;
  token: string | null;
  loading: boolean;
  login: (token: string, userData: any) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('jwtToken');
        const savedUser = await AsyncStorage.getItem('user');
        if (savedToken) {
          setToken(savedToken);
          setIsLoggedIn(true);
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
        }
      } catch (error) {
        console.error('ログイン状態チェック中にエラー:', error);
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  const login = async (token: string, userData: any) => {
    setToken(token);
    setUser(userData);
    setIsLoggedIn(true);
    await AsyncStorage.setItem('jwtToken', token);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    setIsLoggedIn(false);
    await AsyncStorage.removeItem('jwtToken');
    await AsyncStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
