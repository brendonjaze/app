'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { User, UserRole, AuthState } from '@/types';

// Mock users for demonstration
const MOCK_USERS: User[] = [
    {
        id: '1',
        username: 'admin',
        email: 'admin@school.edu',
        role: 'admin',
        fullName: 'System Administrator',
        createdAt: new Date('2024-01-01'),
    },
    {
        id: '2',
        username: 'instructor',
        email: 'instructor@school.edu',
        role: 'instructor',
        fullName: 'John Smith',
        createdAt: new Date('2024-01-15'),
    },
    {
        id: '3',
        username: 'student',
        email: 'student@school.edu',
        role: 'student',
        fullName: 'Jane Doe',
        createdAt: new Date('2024-02-01'),
    },
];

interface AuthContextType extends AuthState {
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: true,
    });

    // Check for existing session on mount
    useEffect(() => {
        const savedUser = localStorage.getItem('attendance_user');
        const timer = setTimeout(() => {
            if (savedUser) {
                try {
                    const user = JSON.parse(savedUser);
                    setAuthState({
                        user,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch {
                    localStorage.removeItem('attendance_user');
                    setAuthState(prev => ({ ...prev, isLoading: false }));
                }
            } else {
                setAuthState(prev => ({ ...prev, isLoading: false }));
            }
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    const login = useCallback(async (username: string, password: string): Promise<boolean> => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));

        // Find matching user (in production, this would be a real API call)
        const user = MOCK_USERS.find(
            u => u.username.toLowerCase() === username.toLowerCase()
        );

        // For demo, password is same as username
        if (user && password === username) {
            localStorage.setItem('attendance_user', JSON.stringify(user));
            setAuthState({
                user,
                isAuthenticated: true,
                isLoading: false,
            });
            return true;
        }

        return false;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('attendance_user');
        setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
        });
    }, []);

    const hasRole = useCallback((roles: UserRole[]): boolean => {
        if (!authState.user) return false;
        return roles.includes(authState.user.role);
    }, [authState.user]);

    return (
        <AuthContext.Provider value={{ ...authState, login, logout, hasRole }}>
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
