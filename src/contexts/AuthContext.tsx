import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
    type User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    signInAnonymously,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

// ─── Types ──────────────────────────────────────────────────────
interface UserProfile {
    uid: string;
    email: string | null;
    role: 'buyer' | 'seller' | 'admin';
    credits_balance: number;
    createdAt: Date | null;
}

interface AuthContextType {
    currentUser: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    loginAnonymously: () => Promise<void>;
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

    // Helper: ensure Firestore profile exists
    const ensureProfile = async (user: User) => {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            setUserProfile(snap.data() as UserProfile);
        } else {
            const profile: UserProfile = {
                uid: user.uid,
                email: user.email,
                role: 'buyer',
                credits_balance: 100, // Welcome bonus
                createdAt: new Date(),
            };
            await setDoc(ref, { ...profile, createdAt: serverTimestamp() });
            setUserProfile(profile);
        }
    };

    // Listen to auth state
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                try {
                    await ensureProfile(user);
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

    // ─── Auth Methods ─────────────────────────────────────────────
    const login = async (email: string, password: string) => {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await ensureProfile(cred.user);
    };

    const register = async (email: string, password: string) => {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await ensureProfile(cred.user);
    };

    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        const cred = await signInWithPopup(auth, provider);
        await ensureProfile(cred.user);
    };

    const loginAnonymously = async () => {
        const cred = await signInAnonymously(auth);
        await ensureProfile(cred.user);
    };

    const logout = async () => {
        await signOut(auth);
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
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
