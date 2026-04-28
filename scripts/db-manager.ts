import * as dotenv from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { applicationDefault, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import {
  FieldValue,
  initializeFirestore,
  type QueryDocumentSnapshot,
  type WhereFilterOp,
} from 'firebase-admin/firestore';

dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ path: '.env', quiet: true });

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 'serviceAccountKey.json';
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!projectId) {
  console.error('Missing Firebase project id. Set FIREBASE_PROJECT_ID or VITE_FIREBASE_PROJECT_ID.');
  process.exit(1);
}

function loadCredential() {
  if (serviceAccountJson) {
    return cert(JSON.parse(serviceAccountJson));
  }

  if (existsSync(serviceAccountPath)) {
    return cert(JSON.parse(readFileSync(serviceAccountPath, 'utf8')));
  }

  return applicationDefault();
}

if (getApps().length === 0) {
  initializeApp({
    credential: loadCredential(),
    projectId,
  });
}

const db = initializeFirestore(getApp(), { preferRest: true });

const knownCollections = [
  'users',
  'seller_applications',
  'sellers',
  'products',
  'credit_packages',
  'credit_orders',
  'usage_logs',
  'seller_earnings',
  'subscriptions',
  'sellerProfiles',
  'apiOffers',
  'apiOfferStats',
  'apiCallRecords',
  'verification_codes',
];

function serializeDoc(snapshot: QueryDocumentSnapshot) {
  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

function parseValue(raw: string) {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw === 'null') return null;
  if (!Number.isNaN(Number(raw)) && raw.trim() !== '') return Number(raw);

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function addTimestamps(data: Record<string, unknown>) {
  return {
    ...data,
    createdAt: data.createdAt ?? FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
}

function printCredentialHelp() {
  console.error(`Firebase Admin credentials are required for database operations.

Set one of these before running data commands:
  1. GOOGLE_APPLICATION_CREDENTIALS=serviceAccountKey.json
  2. FIREBASE_SERVICE_ACCOUNT_KEY='{"project_id":"..."}'

The file serviceAccountKey.json is already ignored by git.`);
}

function isCredentialError(error: unknown) {
  return String((error as Error)?.message || error).includes('Could not load the default credentials');
}

export const dbManager = {
  listCollections() {
    return knownCollections;
  },

  async getCollection(collectionName: string, limitCount = 100) {
    const snapshot = await db.collection(collectionName).limit(limitCount).get();
    return snapshot.docs.map(serializeDoc);
  },

  async queryDocuments(
    collectionName: string,
    field: string,
    operator: WhereFilterOp,
    rawValue: string,
    limitCount = 100
  ) {
    const snapshot = await db
      .collection(collectionName)
      .where(field, operator, parseValue(rawValue))
      .limit(limitCount)
      .get();
    return snapshot.docs.map(serializeDoc);
  },

  async addDocument(collectionName: string, data: Record<string, unknown>) {
    const docRef = await db.collection(collectionName).add(addTimestamps(data));
    return docRef.id;
  },

  async updateDocument(collectionName: string, docId: string, data: Record<string, unknown>) {
    await db.collection(collectionName).doc(docId).update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    });
  },

  async deleteDocument(collectionName: string, docId: string) {
    await db.collection(collectionName).doc(docId).delete();
  },

  async getStats() {
    const entries = await Promise.all(knownCollections.map(async (collectionName) => {
      try {
        const snapshot = await db.collection(collectionName).limit(1000).get();
        return [collectionName, snapshot.size] as const;
      } catch (error) {
        if (isCredentialError(error)) throw error;
        return [collectionName, -1] as const;
      }
    }));

    return Object.fromEntries(entries);
  },

  async getRecent(collectionName: string, limitCount = 20) {
    const snapshot = await db
      .collection(collectionName)
      .orderBy('createdAt', 'desc')
      .limit(limitCount)
      .get();
    return snapshot.docs.map(serializeDoc);
  },
};

async function main() {
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case 'list': {
      console.log(dbManager.listCollections().join('\n'));
      break;
    }

    case 'get': {
      const [collectionName, limitArg] = args;
      if (!collectionName) throw new Error('Usage: npm run db get <collection> [limit]');
      const docs = await dbManager.getCollection(collectionName, Number(limitArg ?? 100));
      console.log(JSON.stringify(docs, null, 2));
      break;
    }

    case 'recent': {
      const [collectionName, limitArg] = args;
      if (!collectionName) throw new Error('Usage: npm run db recent <collection> [limit]');
      const docs = await dbManager.getRecent(collectionName, Number(limitArg ?? 20));
      console.log(JSON.stringify(docs, null, 2));
      break;
    }

    case 'query': {
      const [collectionName, field, operator, value, limitArg] = args;
      if (!collectionName || !field || !operator || value === undefined) {
        throw new Error('Usage: npm run db query <collection> <field> <operator> <value> [limit]');
      }
      const docs = await dbManager.queryDocuments(
        collectionName,
        field,
        operator as WhereFilterOp,
        value,
        Number(limitArg ?? 100)
      );
      console.log(JSON.stringify(docs, null, 2));
      break;
    }

    case 'add': {
      const [collectionName, jsonData] = args;
      if (!collectionName || !jsonData) throw new Error('Usage: npm run db add <collection> <json-data>');
      const id = await dbManager.addDocument(collectionName, JSON.parse(jsonData));
      console.log(`Added ${collectionName}/${id}`);
      break;
    }

    case 'update': {
      const [collectionName, docId, jsonData] = args;
      if (!collectionName || !docId || !jsonData) {
        throw new Error('Usage: npm run db update <collection> <doc-id> <json-data>');
      }
      await dbManager.updateDocument(collectionName, docId, JSON.parse(jsonData));
      console.log(`Updated ${collectionName}/${docId}`);
      break;
    }

    case 'delete': {
      const [collectionName, docId] = args;
      if (!collectionName || !docId) throw new Error('Usage: npm run db delete <collection> <doc-id>');
      await dbManager.deleteDocument(collectionName, docId);
      console.log(`Deleted ${collectionName}/${docId}`);
      break;
    }

    case 'stats': {
      const stats = await dbManager.getStats();
      console.log(JSON.stringify(stats, null, 2));
      break;
    }

    default:
      console.log(`Firebase database manager

Usage:
  npm run db list
  npm run db get <collection> [limit]
  npm run db recent <collection> [limit]
  npm run db stats
  npm run db query <collection> <field> <operator> <value> [limit]
  npm run db add <collection> <json-data>
  npm run db update <collection> <doc-id> <json-data>
  npm run db delete <collection> <doc-id>

Examples:
  npm run db list
  npm run db get products 20
  npm run db query users role == buyer
  npm run db add products "{\\"name\\":\\"Demo\\",\\"status\\":\\"active\\"}"
`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    if (isCredentialError(error)) {
      printCredentialHelp();
    } else {
      console.error(error.message || error);
    }
    process.exit(1);
  });
