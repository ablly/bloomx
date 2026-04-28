import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signInAnonymously,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    sendEmailVerification as firebaseSendEmailVerification,
    updatePassword as firebaseUpdatePassword,
    GoogleAuthProvider,
    type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

// ─── Types ──────────────────────────────────────────────────────

export interface AuthResult {
    success: boolean;
    user?: User;
    error?: AuthError;
}

export interface AuthError {
    code: string;
    message: string;
    messageZh: string;
}

interface AuthEvent {
    uid: string;
    event: 'login' | 'logout' | 'register' | 'password_reset' | 'email_verify';
    method: 'email' | 'google' | 'anonymous';
    success: boolean;
    error?: string;
}

// ─── Error Messages ─────────────────────────────────────────────

const AUTH_ERROR_MESSAGES: Record<string, { en: string; zh: string }> = {
    'auth/user-not-found': {
        en: 'No account found with this email',
        zh: '未找到此邮箱对应的账户',
    },
    'auth/wrong-password': {
        en: 'Incorrect password',
        zh: '密码错误',
    },
    'auth/email-already-in-use': {
        en: 'Email already registered',
        zh: '邮箱已被注册',
    },
    'auth/weak-password': {
        en: 'Password should be at least 6 characters',
        zh: '密码至少需要 6 个字符',
    },
    'auth/invalid-email': {
        en: 'Invalid email format',
        zh: '邮箱格式不正确',
    },
    'auth/invalid-credential': {
        en: 'Invalid email or password',
        zh: '邮箱或密码错误',
    },
    'auth/too-many-requests': {
        en: 'Too many attempts. Please try again later',
        zh: '尝试次数过多，请稍后再试',
    },
    'auth/network-request-failed': {
        en: 'Network error. Please check your connection',
        zh: '网络错误，请检查网络连接',
    },
    'auth/popup-blocked': {
        en: 'Popup blocked. Please allow popups for this site',
        zh: '弹窗被阻止，请允许此网站的弹窗',
    },
    'auth/popup-closed-by-user': {
        en: 'Sign-in cancelled',
        zh: '登录已取消',
    },
    'auth/requires-recent-login': {
        en: 'Please sign in again to continue',
        zh: '请重新登录以继续',
    },
    'auth/user-disabled': {
        en: 'This account has been disabled',
        zh: '此账户已被禁用',
    },
};

// ─── Helper Functions ───────────────────────────────────────────

function mapAuthError(error: any): AuthError {
    const code = error.code || 'unknown';
    const messages = AUTH_ERROR_MESSAGES[code] || {
        en: error.message || 'An error occurred',
        zh: '发生错误',
    };

    return {
        code,
        message: messages.en,
        messageZh: messages.zh,
    };
}

async function ensureUserProfile(user: User): Promise<void> {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: 'buyer',
            credits_balance: 100,
            emailVerified: user.emailVerified,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
        });
    } else {
        await updateDoc(userRef, {
            lastLoginAt: serverTimestamp(),
            emailVerified: user.emailVerified,
        });
    }
}

async function logAuthEvent(event: AuthEvent): Promise<void> {
    try {
        const logsRef = collection(db, 'users', event.uid, 'auth_logs');
        await addDoc(logsRef, {
            ...event,
            timestamp: serverTimestamp(),
            userAgent: navigator.userAgent,
        });
    } catch (error) {
        console.error('Failed to log auth event:', error);
    }
}

// ─── Auth Service ───────────────────────────────────────────────

export const authService = {
    /**
     * 邮箱密码登录
     */
    async signInWithEmail(email: string, password: string): Promise<AuthResult> {
        try {
            const credential = await signInWithEmailAndPassword(auth, email, password);
            await ensureUserProfile(credential.user);
            await logAuthEvent({
                uid: credential.user.uid,
                event: 'login',
                method: 'email',
                success: true,
            });

            return { success: true, user: credential.user };
        } catch (error: any) {
            const authError = mapAuthError(error);
            console.error('Email sign-in failed:', authError);
            return { success: false, error: authError };
        }
    },

    /**
     * 邮箱密码注册（需要验证码）
     */
    async registerWithEmail(email: string, password: string, verificationCode?: string): Promise<AuthResult> {
        try {
            // 如果提供了验证码，先验证
            if (verificationCode) {
                const { verifyEmailCode } = await import('./captchaService');
                const verifyResult = await verifyEmailCode(email, verificationCode);
                
                if (!verifyResult.success) {
                    return {
                        success: false,
                        error: {
                            code: 'auth/invalid-verification-code',
                            message: verifyResult.error || 'Invalid verification code',
                            messageZh: verifyResult.error || '验证码错误'
                        }
                    };
                }
            } else {
                // 没有提供验证码，返回错误
                return {
                    success: false,
                    error: {
                        code: 'auth/verification-code-required',
                        message: 'Verification code is required',
                        messageZh: '请输入验证码'
                    }
                };
            }

            const credential = await createUserWithEmailAndPassword(auth, email, password);
            await ensureUserProfile(credential.user);
            
            // 自动发送验证邮件
            await this.sendEmailVerification();

            await logAuthEvent({
                uid: credential.user.uid,
                event: 'register',
                method: 'email',
                success: true,
            });

            return { success: true, user: credential.user };
        } catch (error: any) {
            const authError = mapAuthError(error);
            console.error('Email registration failed:', authError);
            return { success: false, error: authError };
        }
    },

    /**
     * Google 登录
     */
    async signInWithGoogle(): Promise<AuthResult> {
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({
                prompt: 'select_account',
            });
            
            const credential = await signInWithPopup(auth, provider);
            await ensureUserProfile(credential.user);
            await logAuthEvent({
                uid: credential.user.uid,
                event: 'login',
                method: 'google',
                success: true,
            });

            return { success: true, user: credential.user };
        } catch (error: any) {
            const authError = mapAuthError(error);
            console.error('Google sign-in failed:', authError);
            return { success: false, error: authError };
        }
    },

    /**
     * 匿名登录
     */
    async signInAnonymously(): Promise<AuthResult> {
        try {
            const credential = await signInAnonymously(auth);
            await ensureUserProfile(credential.user);
            await logAuthEvent({
                uid: credential.user.uid,
                event: 'login',
                method: 'anonymous',
                success: true,
            });

            return { success: true, user: credential.user };
        } catch (error: any) {
            const authError = mapAuthError(error);
            console.error('Anonymous sign-in failed:', authError);
            return { success: false, error: authError };
        }
    },

    /**
     * 登出
     */
    async signOut(): Promise<void> {
        const uid = auth.currentUser?.uid;
        await firebaseSignOut(auth);
        
        if (uid) {
            await logAuthEvent({
                uid,
                event: 'logout',
                method: 'email',
                success: true,
            });
        }
    },

    /**
     * 发送密码重置邮件
     */
    async resetPassword(email: string): Promise<AuthResult> {
        try {
            await sendPasswordResetEmail(auth, email);
            return { success: true };
        } catch (error: any) {
            const authError = mapAuthError(error);
            console.error('Password reset failed:', authError);
            return { success: false, error: authError };
        }
    },

    /**
     * 更新密码
     */
    async updatePassword(newPassword: string): Promise<AuthResult> {
        try {
            const user = auth.currentUser;
            if (!user) {
                return {
                    success: false,
                    error: {
                        code: 'auth/no-user',
                        message: 'No user signed in',
                        messageZh: '未登录',
                    },
                };
            }

            await firebaseUpdatePassword(user, newPassword);
            return { success: true };
        } catch (error: any) {
            const authError = mapAuthError(error);
            console.error('Password update failed:', authError);
            return { success: false, error: authError };
        }
    },

    /**
     * 发送邮箱验证邮件
     */
    async sendEmailVerification(): Promise<AuthResult> {
        try {
            const user = auth.currentUser;
            if (!user) {
                return {
                    success: false,
                    error: {
                        code: 'auth/no-user',
                        message: 'No user signed in',
                        messageZh: '未登录',
                    },
                };
            }

            await firebaseSendEmailVerification(user);
            
            await logAuthEvent({
                uid: user.uid,
                event: 'email_verify',
                method: 'email',
                success: true,
            });

            return { success: true };
        } catch (error: any) {
            const authError = mapAuthError(error);
            console.error('Email verification failed:', authError);
            return { success: false, error: authError };
        }
    },

    /**
     * 检查邮箱是否已验证
     */
    async checkEmailVerified(): Promise<boolean> {
        const user = auth.currentUser;
        if (!user) return false;

        await user.reload();
        return user.emailVerified;
    },

    /**
     * 获取当前用户
     */
    getCurrentUser(): User | null {
        return auth.currentUser;
    },
};
