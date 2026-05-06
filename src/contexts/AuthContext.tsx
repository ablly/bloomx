import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
    type User,
    onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { authService, type AuthResult } from '../services/authService';

// ─── Types ──────────────────────────────────────────────────────
interface UserProfile {
    uid: string;
    email: string | null;
    role: 'buyer' | 'seller' | 'admin';
    credits: number;
    createdAt: Date | null;
}

interface AuthContextType {
    currentUser: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<AuthResult>;
    register: (email: string, password: string, verificationCode?: string) => Promise<AuthResult>;
    loginWithGoogle: () => Promise<AuthResult>;
    loginAnonymously: () => Promise<AuthResult>;
    resetPassword: (email: string) => Promise<AuthResult>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Hook ───────────────────────────────────────────────────────
export const useAuth = (): AuthContextType => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};

// ─── Provider ───────────────────────────────────────────────────
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Helper: load user profile from Firestore
    const loadProfile = async (user: User) => {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const data = snap.data();
            const credits = Number(data.credits_balance ?? data.credits ?? 0);

            if (data.credits_balance === undefined && data.credits !== undefined) {
                await updateDoc(ref, {
                    credits_balance: credits,
                    updatedAt: serverTimestamp(),
                });
            }

            setUserProfile({
                uid: data.uid,
                email: data.email,
                role: data.role || 'buyer',
                credits,
                createdAt: data.createdAt?.toDate?.() || null,
            });
        }
    };

    const applyProfileData = async (uid: string, data: Record<string, any>) => {
        const credits = Number(data.credits_balance ?? data.credits ?? 0);

        if (data.credits_balance === undefined && data.credits !== undefined) {
            await updateDoc(doc(db, 'users', uid), {
                credits_balance: credits,
                updatedAt: serverTimestamp(),
            });
        }

        setUserProfile({
            uid: data.uid || uid,
            email: data.email,
            role: data.role || 'buyer',
            credits,
            createdAt: data.createdAt?.toDate?.() || null,
        });
    };

    // Listen to auth state
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                try {
                    await loadProfile(user);
                } catch (e) {
                    console.error('Failed to load profile:', e);
                }
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });
        return unsub;
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        const ref = doc(db, 'users', currentUser.uid);
        return onSnapshot(ref, (snap) => {
            if (!snap.exists()) return;
            void applyProfileData(currentUser.uid, snap.data());
        }, (error) => {
            console.error('Failed to subscribe profile:', error);
        });
    }, [currentUser?.uid]);

    // ─── Auth Methods ─────────────────────────────────────────────
    const login = async (email: string, password: string): Promise<AuthResult> => {
        const result = await authService.signInWithEmail(email, password);
        if (result.success && result.user) {
            await loadProfile(result.user);
        }
        return result;
    };

    const register = async (email: string, password: string, verificationCode?: string): Promise<AuthResult> => {
        const result = await authService.registerWithEmail(email, password, verificationCode);
        if (result.success && result.user) {
            await loadProfile(result.user);
        }
        return result;
    };

    const loginWithGoogle = async (): Promise<AuthResult> => {
        const result = await authService.signInWithGoogle();
        if (result.success && result.user) {
            await loadProfile(result.user);
        }
        return result;
    };

    const loginAnonymously = async (): Promise<AuthResult> => {
        const result = await authService.signInAnonymously();
        if (result.success && result.user) {
            await loadProfile(result.user);
        }
        return result;
    };

    const resetPassword = async (email: string): Promise<AuthResult> => {
        return await authService.resetPassword(email);
    };

    const logout = async () => {
        await authService.signOut();
        setUserProfile(null);
    };

    return (
        <AuthContext.Provider
            value={{
                currentUser,
                userProfile,
                loading,
                login,
                register,
                loginWithGoogle,
                loginAnonymously,
                resetPassword,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
