import { createSign } from 'crypto';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('serviceAccountKey.json', 'utf8'));

function base64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

const now = Math.floor(Date.now() / 1000);
const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
const payload = base64Url(JSON.stringify({
  iss: serviceAccount.client_email,
  scope: process.env.GOOGLE_AUTH_SCOPE || 'https://www.googleapis.com/auth/datastore',
  aud: 'https://oauth2.googleapis.com/token',
  iat: now,
  exp: now + 3600,
}));
const unsigned = `${header}.${payload}`;
const signer = createSign('RSA-SHA256');
signer.update(unsigned);
signer.end();

process.stdout.write(`${unsigned}.${base64Url(signer.sign(serviceAccount.private_key))}`);
