import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendEmailVerification as firebaseSendEmailVerification,
  sendPasswordResetEmail,
  signInAnonymously as firebaseSignInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updatePassword as firebaseUpdatePassword,
  type User,
} from 'firebase/auth';
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

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
    zh: '弹窗被阻止，请允许此网站弹窗',
  },
  'auth/popup-closed-by-user': {
    en: 'Sign-in cancelled',
    zh: '登录已取消',
  },
  'auth/requires-recent-login': {
    en: 'Please sign in again to continue',
    zh: '请重新登录后继续',
  },
  'auth/user-disabled': {
    en: 'This account has been disabled',
    zh: '此账户已被停用',
  },
};

function mapAuthError(error: unknown): AuthError {
  const firebaseError = error as { code?: string; message?: string };
  const code = firebaseError.code || 'unknown';
  const messages = AUTH_ERROR_MESSAGES[code] || {
    en: firebaseError.message || 'An error occurred',
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

export const authService = {
  async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await ensureUserProfile(credential.user);
      await logAuthEvent({ uid: credential.user.uid, event: 'login', method: 'email', success: true });
      return { success: true, user: credential.user };
    } catch (error) {
      return { success: false, error: mapAuthError(error) };
    }
  },

  async registerWithEmail(email: string, password: string, verificationCode?: string): Promise<AuthResult> {
    try {
      if (!verificationCode) {
        return {
          success: false,
          error: {
            code: 'auth/verification-code-required',
            message: 'Verification code is required',
            messageZh: '请输入验证码',
          },
        };
      }

      const { verifyEmailCode } = await import('./captchaService');
      const verifyResult = await verifyEmailCode(email, verificationCode);
      if (!verifyResult.success) {
        return {
          success: false,
          error: {
            code: 'auth/invalid-verification-code',
            message: verifyResult.error || 'Invalid verification code',
            messageZh: verifyResult.error || '验证码错误',
          },
        };
      }

      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await ensureUserProfile(credential.user);
      await this.sendEmailVerification();
      await logAuthEvent({ uid: credential.user.uid, event: 'register', method: 'email', success: true });

      return { success: true, user: credential.user };
    } catch (error) {
      return { success: false, error: mapAuthError(error) };
    }
  },

  async signInWithGoogle(): Promise<AuthResult> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const credential = await signInWithPopup(auth, provider);
      await ensureUserProfile(credential.user);
      await logAuthEvent({ uid: credential.user.uid, event: 'login', method: 'google', success: true });
      return { success: true, user: credential.user };
    } catch (error) {
      return { success: false, error: mapAuthError(error) };
    }
  },

  async signInAnonymously(): Promise<AuthResult> {
    try {
      const credential = await firebaseSignInAnonymously(auth);
      await ensureUserProfile(credential.user);
      await logAuthEvent({ uid: credential.user.uid, event: 'login', method: 'anonymous', success: true });
      return { success: true, user: credential.user };
    } catch (error) {
      return { success: false, error: mapAuthError(error) };
    }
  },

  async signOut(): Promise<void> {
    const uid = auth.currentUser?.uid;
    await firebaseSignOut(auth);
    if (uid) {
      await logAuthEvent({ uid, event: 'logout', method: 'email', success: true });
    }
  },

  async resetPassword(email: string): Promise<AuthResult> {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      return { success: false, error: mapAuthError(error) };
    }
  },

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
    } catch (error) {
      return { success: false, error: mapAuthError(error) };
    }
  },

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
      await logAuthEvent({ uid: user.uid, event: 'email_verify', method: 'email', success: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: mapAuthError(error) };
    }
  },

  async checkEmailVerified(): Promise<boolean> {
    const user = auth.currentUser;
    if (!user) return false;
    await user.reload();
    return user.emailVerified;
  },

  getCurrentUser(): User | null {
    return auth.currentUser;
  },
};
