import { createSign } from 'crypto';
import { lookup } from 'dns';
import { readFileSync } from 'fs';
import { request } from 'https';

const serviceAccount = JSON.parse(readFileSync('serviceAccountKey.json', 'utf8'));
const projectId = serviceAccount.project_id;

function base64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function createAssertion() {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${payload}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  return `${unsigned}.${base64Url(signer.sign(serviceAccount.private_key))}`;
}

function httpsRequestJson<T>(
  method: 'GET' | 'POST',
  url: string,
  body?: string,
  headers: Record<string, string> = {}
): Promise<T> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = request({
      method,
      hostname: parsed.hostname,
      path: `${parsed.pathname}${parsed.search}`,
      port: 443,
      headers,
      lookup(hostname, options, callback) {
        lookup(hostname, { ...options, family: 4 }, callback);
      },
      timeout: 30000,
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`${res.statusCode} ${res.statusMessage}: ${text}`));
          return;
        }
        resolve(text ? JSON.parse(text) : null);
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error(`Request timed out: ${url}`));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function getAccessToken() {
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: createAssertion(),
  }).toString();

  const response = await httpsRequestJson<{ access_token: string }>(
    'POST',
    'https://oauth2.googleapis.com/token',
    body,
    {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': String(Buffer.byteLength(body)),
    }
  );

  return response.access_token;
}

function decodeValue(value: any): any {
  if (!value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in value) {
    return Object.fromEntries(
      Object.entries(value.mapValue.fields || {}).map(([key, nested]) => [key, decodeValue(nested)])
    );
  }
  return value;
}

function decodeDocument(doc: any) {
  const id = String(doc.name).split('/').pop();
  return {
    id,
    ...Object.fromEntries(
      Object.entries(doc.fields || {}).map(([key, value]) => [key, decodeValue(value)])
    ),
  };
}

async function listCollection(token: string, collectionName: string, pageSize = 3) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}?pageSize=${pageSize}`;
  const data = await httpsRequestJson<any>('GET', url, undefined, {
    Authorization: `Bearer ${token}`,
  });

  return (data.documents || []).map(decodeDocument);
}

async function main() {
  const token = await getAccessToken();
  const collections = ['users', 'products', 'sellers', 'apiOffers', 'subscriptions'];
  const result: Record<string, unknown> = {};

  for (const collectionName of collections) {
    result[collectionName] = await listCollection(token, collectionName, 3);
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
