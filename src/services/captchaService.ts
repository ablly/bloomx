import { RecaptchaVerifier } from 'firebase/auth';
import { addDoc, collection, deleteDoc, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth, db } from '../lib/firebase';

export interface CaptchaResult {
    success: boolean;
    error?: string;
}

export interface EmailVerificationResult {
    success: boolean;
    error?: string;
    verificationId?: string;
}

type EmailPayload = {
    email: string;
    code?: string;
};

type CallableResult = {
    success: boolean;
};

const useCallableVerification = () =>
    import.meta.env.PROD || import.meta.env.VITE_USE_FUNCTION_VERIFICATION === 'true';

const shouldLogLocalVerificationCode = () =>
    import.meta.env.DEV && import.meta.env.VITE_DEBUG_VERIFICATION_CODE === 'true';

function generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function errorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

async function callFunction(name: string, payload: EmailPayload): Promise<CallableResult> {
    const functions = getFunctions();
    const callable = httpsCallable<EmailPayload, CallableResult>(functions, name);
    const result = await callable(payload);
    return result.data;
}

export async function sendEmailVerificationCode(email: string): Promise<EmailVerificationResult> {
    try {
        if (useCallableVerification()) {
            await callFunction('sendVerificationEmail', { email });
            return { success: true };
        }

        const recentQuery = query(
            collection(db, 'verification_codes'),
            where('email', '==', email),
            where('createdAt', '>', new Date(Date.now() - 5 * 60 * 1000))
        );

        const recentDocs = await getDocs(recentQuery);
        if (!recentDocs.empty) {
            return {
                success: false,
                error: 'Verification code already sent. Please wait 5 minutes.',
            };
        }

        const code = generateVerificationCode();
        const docRef = await addDoc(collection(db, 'verification_codes'), {
            email,
            code,
            createdAt: serverTimestamp(),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            verified: false,
            attempts: 0,
        });

        if (shouldLogLocalVerificationCode()) {
            console.info('Local verification code generated:', {
                email,
                code,
                verificationId: docRef.id,
                expiresIn: '10 minutes',
            });
        }

        return {
            success: true,
            verificationId: docRef.id,
        };
    } catch (error) {
        console.error('Failed to send verification code:', error);
        return {
            success: false,
            error: errorMessage(error, 'Failed to send verification code'),
        };
    }
}

export async function verifyEmailCode(email: string, code: string): Promise<CaptchaResult> {
    try {
        if (useCallableVerification()) {
            await callFunction('verifyEmailCode', { email, code });
            return { success: true };
        }

        const codeQuery = query(
            collection(db, 'verification_codes'),
            where('email', '==', email),
            where('code', '==', code),
            where('verified', '==', false)
        );

        const querySnapshot = await getDocs(codeQuery);

        if (querySnapshot.empty) {
            return {
                success: false,
                error: 'Verification code is invalid or expired.',
            };
        }

        const codeDoc = querySnapshot.docs[0];
        const data = codeDoc.data();
        const expiresAt = data.expiresAt?.toDate();

        if (expiresAt && expiresAt < new Date()) {
            await deleteDoc(codeDoc.ref);
            return {
                success: false,
                error: 'Verification code expired.',
            };
        }

        if (data.attempts >= 5) {
            await deleteDoc(codeDoc.ref);
            return {
                success: false,
                error: 'Too many verification attempts.',
            };
        }

        await deleteDoc(codeDoc.ref);

        const cleanupQuery = query(collection(db, 'verification_codes'), where('email', '==', email));
        const cleanupDocs = await getDocs(cleanupQuery);
        await Promise.all(cleanupDocs.docs.map((item) => deleteDoc(item.ref)));

        return { success: true };
    } catch (error) {
        console.error('Failed to verify email code:', error);
        return {
            success: false,
            error: errorMessage(error, 'Verification failed'),
        };
    }
}

export async function cleanupExpiredCodes(): Promise<void> {
    if (useCallableVerification()) {
        return;
    }

    try {
        const expiredQuery = query(collection(db, 'verification_codes'), where('expiresAt', '<', new Date()));
        const expiredDocs = await getDocs(expiredQuery);
        await Promise.all(expiredDocs.docs.map((item) => deleteDoc(item.ref)));
    } catch (error) {
        console.error('Failed to clean expired verification codes:', error);
    }
}

let recaptchaVerifier: RecaptchaVerifier | null = null;

export function initRecaptcha(containerId: string): RecaptchaVerifier {
    if (recaptchaVerifier) {
        return recaptchaVerifier;
    }

    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => undefined,
        'expired-callback': () => undefined,
    });

    return recaptchaVerifier;
}

export function clearRecaptcha(): void {
    if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        recaptchaVerifier = null;
    }
}
