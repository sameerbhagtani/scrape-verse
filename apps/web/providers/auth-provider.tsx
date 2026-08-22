"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ApiResponse, AuthResponse, User } from "@scrape-verse/types";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api").replace(/\/$/, "");

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (
        name: string,
        email: string,
        password: string,
    ) => Promise<{ success: boolean; error?: string; user?: User }>;
    verifyOTP: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
    resendOTP: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
    logout: () => Promise<void>;
    forgotPassword: (
        email: string,
    ) => Promise<{ success: boolean; message?: string; error?: string }>;
    refreshSession: () => Promise<boolean>;
    authFetch: (url: string, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Refresh user session via httpOnly cookie
    const refreshSession = useCallback(async (): Promise<boolean> => {
        try {
            const res = await fetch(`${API_URL}/auth/refresh`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                credentials: "include",
            });

            if (!res.ok) {
                setUser(null);
                setAccessToken(null);
                return false;
            }

            const payload = (await res.json()) as ApiResponse<AuthResponse>;
            if (payload.data?.user && payload.data?.accessToken) {
                setUser(payload.data.user);
                setAccessToken(payload.data.accessToken);
                return true;
            }
            return false;
        } catch {
            setUser(null);
            setAccessToken(null);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Try restoring session on mount
    useEffect(() => {
        void refreshSession();
    }, [refreshSession]);

    // Login with email & password
    const login = async (
        email: string,
        password: string,
    ): Promise<{ success: boolean; error?: string }> => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ email, password }),
                credentials: "include",
            });

            const data = await res.json();
            if (!res.ok) {
                return {
                    success: false,
                    error: data.message || "Invalid credentials. Please try again.",
                };
            }

            const payload = data as ApiResponse<AuthResponse>;
            if (payload.data?.user && payload.data?.accessToken) {
                setUser(payload.data.user);
                setAccessToken(payload.data.accessToken);
                return { success: true };
            }
            return { success: false, error: "Unexpected response from auth service" };
        } catch (err) {
            return {
                success: false,
                error: (err as Error).message || "Connection to auth server failed",
            };
        } finally {
            setIsLoading(false);
        }
    };

    // Sign up with name, email & password
    const signup = async (
        name: string,
        email: string,
        password: string,
    ): Promise<{ success: boolean; error?: string; user?: User }> => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/signup`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ name, email, password }),
                credentials: "include",
            });

            const data = await res.json();
            if (!res.ok) {
                return {
                    success: false,
                    error: data.message || "Signup failed. Please try again.",
                };
            }

            const payload = data as ApiResponse<AuthResponse>;
            if (payload.data?.user) {
                setUser(payload.data.user);
                if (payload.data.accessToken) {
                    setAccessToken(payload.data.accessToken);
                }
                return { success: true, user: payload.data.user };
            }
            return { success: false, error: "Unexpected response from auth service" };
        } catch (err) {
            return {
                success: false,
                error: (err as Error).message || "Connection to auth server failed",
            };
        } finally {
            setIsLoading(false);
        }
    };

    // Verify OTP
    const verifyOTP = async (
        email: string,
        otp: string,
    ): Promise<{ success: boolean; error?: string }> => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/auth/verify-otp`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ email, otp }),
                credentials: "include",
            });

            const data = await res.json();
            if (!res.ok) {
                return {
                    success: false,
                    error: data.message || "Verification failed. Please check the code.",
                };
            }

            const payload = data as ApiResponse<AuthResponse>;
            if (payload.data?.user) {
                setUser(payload.data.user);
                if (payload.data.accessToken) {
                    setAccessToken(payload.data.accessToken);
                }
                return { success: true };
            }
            return { success: true };
        } catch (err) {
            return {
                success: false,
                error: (err as Error).message || "Connection to auth server failed",
            };
        } finally {
            setIsLoading(false);
        }
    };

    // Resend OTP
    const resendOTP = async (
        email: string,
    ): Promise<{ success: boolean; message?: string; error?: string }> => {
        try {
            const res = await fetch(`${API_URL}/auth/resend-otp`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            if (!res.ok) {
                return {
                    success: false,
                    error: data.message || "Failed to resend code.",
                };
            }

            return {
                success: true,
                message: data.message || "Verification code sent to your email.",
            };
        } catch (err) {
            return {
                success: false,
                error: (err as Error).message || "Failed to reach server.",
            };
        }
    };

    // Logout
    const logout = async (): Promise<void> => {
        try {
            await fetch(`${API_URL}/auth/logout`, {
                method: "POST",
                credentials: "include",
            });
        } catch {
            // ignore network err
        } finally {
            setUser(null);
            setAccessToken(null);
        }
    };

    // Forgot password
    const forgotPassword = async (
        email: string,
    ): Promise<{ success: boolean; message?: string; error?: string }> => {
        try {
            const res = await fetch(`${API_URL}/auth/forgot-password`, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            if (!res.ok) {
                return {
                    success: false,
                    error: data.message || "Failed to process forgot password request.",
                };
            }

            return {
                success: true,
                message: data.message || "Password reset instructions sent.",
            };
        } catch (err) {
            return {
                success: false,
                error: (err as Error).message || "Failed to reach server.",
            };
        }
    };

    // Authenticated fetch wrapper that auto-injects bearer token
    const authFetch = async (url: string, init?: RequestInit): Promise<Response> => {
        const headers = new Headers(init?.headers);
        if (accessToken) {
            headers.set("Authorization", `Bearer ${accessToken}`);
        }

        let res = await fetch(url, {
            ...init,
            headers,
            credentials: "include",
        });

        // If 401 Unauthorized, attempt refresh once
        if (res.status === 401) {
            const refreshed = await refreshSession();
            if (refreshed && accessToken) {
                headers.set("Authorization", `Bearer ${accessToken}`);
                res = await fetch(url, {
                    ...init,
                    headers,
                    credentials: "include",
                });
            }
        }

        return res;
    };

    const value: AuthContextType = {
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        verifyOTP,
        resendOTP,
        logout,
        forgotPassword,
        refreshSession,
        authFetch,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
