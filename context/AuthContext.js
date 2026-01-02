"use client";

import { createContext, useContext } from 'react';
import { useSession, signOut } from 'next-auth/react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const { data: session, status } = useSession();

    const logout = () => {
        signOut({ callbackUrl: '/' });
    };

    const currentUserId = session?.user?.id;
    const role = session?.user?.role;

    return (
        <AuthContext.Provider value={{
            currentUserId,
            role,
            currentUser: session?.user,
            isAuthenticated: status === 'authenticated',
            isLoading: status === 'loading',
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
