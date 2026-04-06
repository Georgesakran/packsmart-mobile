import React, { createContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginUser, registerUser } from "../api/authApi";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [userToken, setUserToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const loadStoredToken = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          setUserToken(token);
        }
      } catch (error) {
        console.error("Load stored token error:", error);
      } finally {
        setAuthLoading(false);
      }
    };

    loadStoredToken();
  }, []);

  const login = async ({ email, password }) => {
    const data = await loginUser({ email, password });

    const token =
      data?.token ||
      data?.accessToken ||
      data?.user?.token;

    if (!token) {
      throw new Error("No token returned from login.");
    }

    await AsyncStorage.setItem("token", token);
    setUserToken(token);

    return data;
  };

  const register = async ({ fullName, email, password }) => {
    const data = await registerUser({ fullName, email, password });

    return data;
  };

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    setUserToken(null);
  };

  const value = useMemo(
    () => ({
      userToken,
      isAuthenticated: !!userToken,
      authLoading,
      login,
      register,
      logout,
    }),
    [userToken, authLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}