import { getApps, initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const nodeEnv = (globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
}).process?.env ?? {};
const viteEnv = import.meta.env ?? nodeEnv;

export const firebaseConfig = {
    apiKey: viteEnv.VITE_FIREBASE_API_KEY,
    authDomain: viteEnv.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: viteEnv.VITE_FIREBASE_PROJECT_ID,
    storageBucket: viteEnv.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: viteEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: viteEnv.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

if (!isFirebaseConfigured) {
    console.warn('Firebase config is incomplete. Check your VITE_FIREBASE_* environment variables.');
}

const app = getApps()[0] || initializeApp(firebaseConfig);
const appCheckSiteKey = viteEnv.VITE_APPCHECK_RECAPTCHA_SITE_KEY;
const isLocalPreview =
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

if (appCheckSiteKey && typeof window !== 'undefined' && !isLocalPreview) {
    initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(appCheckSiteKey),
        isTokenAutoRefreshEnabled: true,
    });
}

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
