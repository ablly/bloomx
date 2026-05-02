import * as admin from 'firebase-admin';
import {createHash} from 'crypto';
import * as functions from 'firebase-functions';
import {defineSecret} from 'firebase-functions/params';
import * as nodemailer from 'nodemailer';
import {callMerchantChat, type MerchantApiTestPayload} from './platformProxy';

if (!admin.apps.length) {
  admin.initializeApp();
}

const firestore = admin.firestore();

const EMAIL_USER = defineSecret('EMAIL_USER');
const EMAIL_PASSWORD = defineSecret('EMAIL_PASSWORD');

const createMailTransport = () => {
  const user = EMAIL_USER.value() || process.env.EMAIL_USER;
  const pass = EMAIL_PASSWORD.value() || process.env.EMAIL_PASSWORD;

  if (!user || !pass) {
    throw new functions.https.HttpsError('failed-precondition', 'Email credentials are not configured');
  }

  return {
    from: `"BloomX" <${user}>`,
    transporter: nodemailer.createTransport({
      service: 'gmail',
      auth: {user, pass},
    }),
  };
};

type EmailPayload = {
  email?: string;
  code?: string;
};

const generateVerificationCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const verificationCodeRefForEmail = (email: string) =>
  firestore.collection('verification_codes').doc(createHash('sha256').update(email).digest('hex'));

const assertEmail = (email: unknown): string => {
  const normalized = String(email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid email format');
  }
  return normalized;
};

const assertCode = (code: unknown): string => {
  const normalized = String(code || '').trim();
  if (!/^\d{6}$/.test(normalized)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid code format');
  }
  return normalized;
};

export const sendVerificationEmail = functions
  .runWith({secrets: [EMAIL_USER, EMAIL_PASSWORD], invoker: 'public'})
  .https.onCall(async (data: EmailPayload) => {
    const email = assertEmail(data.email);
    const code = generateVerificationCode();

    const codeRef = verificationCodeRefForEmail(email);
    const existingCode = await codeRef.get();
    const existingData = existingCode.data();
    const existingCreatedAt = existingData?.createdAt as admin.firestore.Timestamp | undefined;

    if (existingCreatedAt && existingCreatedAt.toMillis() > Date.now() - 5 * 60 * 1000) {
      throw new functions.https.HttpsError('resource-exhausted', 'Please wait before requesting another code');
    }

    await codeRef.set({
      email,
      code,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 10 * 60 * 1000),
      verified: false,
      attempts: 0,
    });

    try {
      const mail = createMailTransport();

      await mail.transporter.sendMail({
        from: mail.from,
        to: email,
        subject: 'Your BloomX verification code',
        html: `
        <!doctype html>
        <html>
          <body style="font-family:Arial,sans-serif;line-height:1.6;color:#222;">
            <h2>BloomX verification</h2>
            <p>Your verification code is:</p>
            <p style="font-size:32px;font-weight:700;letter-spacing:6px;">${code}</p>
            <p>This code expires in 10 minutes. Do not share it with anyone.</p>
          </body>
        </html>
      `,
        text: `Your BloomX verification code is ${code}. It expires in 10 minutes.`,
      });

      await firestore.collection('email_logs').add({
        email,
        type: 'verification_code',
        status: 'sent',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {success: true};
    } catch (error) {
      await Promise.all([
        codeRef.delete(),
        firestore.collection('email_logs').add({
          email,
          type: 'verification_code',
          status: 'failed',
          error: error instanceof Error ? error.message : 'unknown_error',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        }),
      ]);

      throw new functions.https.HttpsError('internal', 'Failed to send verification email');
    }
  });

export const verifyEmailCode = functions
  .runWith({invoker: 'public'})
  .https.onCall(async (data: EmailPayload) => {
  const email = assertEmail(data.email);
  const code = assertCode(data.code);

  const codeDoc = await verificationCodeRefForEmail(email).get();

  if (!codeDoc.exists) {
    throw new functions.https.HttpsError('permission-denied', 'Invalid verification code');
  }

  const codeData = codeDoc.data();
  if (!codeData) {
    throw new functions.https.HttpsError('permission-denied', 'Invalid verification code');
  }
  const expiresAt = codeData.expiresAt as admin.firestore.Timestamp | undefined;
  const attempts = Number(codeData.attempts || 0);

  if (!expiresAt || expiresAt.toMillis() < Date.now()) {
    await codeDoc.ref.delete();
    throw new functions.https.HttpsError('deadline-exceeded', 'Verification code expired');
  }

  if (attempts >= 5) {
    await codeDoc.ref.delete();
    throw new functions.https.HttpsError('resource-exhausted', 'Too many verification attempts');
  }

  if (codeData.code !== code || codeData.verified !== false) {
    await codeDoc.ref.update({attempts: admin.firestore.FieldValue.increment(1)});
    throw new functions.https.HttpsError('permission-denied', 'Invalid verification code');
  }

  await codeDoc.ref.delete();

  return { success: true };
  });

export const testMerchantApi = functions
  .runWith({invoker: 'public'})
  .https.onCall(async (data: MerchantApiTestPayload, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Please sign in before testing merchant API');
    }

    const result = await callMerchantChat(data);
    await firestore.collection('merchantApiTestLogs').add({
      ownerId: context.auth.uid,
      modelName: String(data.modelName || ''),
      endpoint: result.endpoint,
      ok: result.ok,
      merchantStatus: result.status,
      latencyMs: result.latencyMs,
      responsePreview: result.text.slice(0, 1000),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (!result.ok) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Merchant API test failed with HTTP ${result.status}`,
        {
          merchantStatus: result.status,
          latencyMs: result.latencyMs,
          responsePreview: result.text.slice(0, 1000),
        }
      );
    }

    return {
      success: true,
      merchantStatus: result.status,
      latencyMs: result.latencyMs,
      responsePreview: result.text.slice(0, 1000),
    };
  });

export const cleanupExpiredCodes = functions.pubsub.schedule('every 1 hours').onRun(async () => {
  const now = admin.firestore.Timestamp.now();
  const expiredQuery = await firestore.collection('verification_codes').where('expiresAt', '<', now).get();

  const batch = firestore.batch();
  expiredQuery.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  console.log(`Cleaned up ${expiredQuery.size} expired verification codes`);
  return null;
});

export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  try {
    await firestore.collection('users').doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      role: 'buyer',
      credits_balance: 100,
      emailVerified: user.emailVerified,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Created user profile for ${user.uid}`);
  } catch (error) {
    console.error('Failed to create user profile:', error);
  }
});

export const onUserDelete = functions.auth.user().onDelete(async (user) => {
  try {
    const batch = firestore.batch();
    batch.delete(firestore.collection('users').doc(user.uid));

    const [apiKeysQuery, transactionsQuery] = await Promise.all([
      firestore.collection('users').doc(user.uid).collection('api_keys').get(),
      firestore.collection('users').doc(user.uid).collection('transactions').get(),
    ]);

    apiKeysQuery.docs.forEach((doc) => batch.delete(doc.ref));
    transactionsQuery.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    console.log(`Cleaned up data for deleted user ${user.uid}`);
  } catch (error) {
    console.error('Failed to cleanup user data:', error);
  }
});

export { invokeMerchantModel } from './platformProxy';
export { runAdminAction } from './adminActions';
export { fetchSellerApiModels, submitSellerApiProduct, testSellerApiModels } from './sellerApiOnboarding';
export {
  onSellerApplicationCreated,
  onSupportTicketCreated,
  onPaymentTransactionCreated,
  onUserPaymentTransactionCreated,
  sendMonthlySettlementSnapshotToMake,
  sendApiHealthSnapshotToMake,
  onUserProfileCreated,
  onUserProfileDeleted,
  onEmailLogCreated,
  onSellerProfileCreated,
  onApiOfferCreated,
  onApiOfferStatusChanged,
  onSellerProductCreated,
  onProductCreated,
  onMerchantApiTestLogCreated,
  onApiCallRecordCompleted,
  onSubscriptionCreated,
  onPurchaseCreated,
} from './makeWorkflows';
