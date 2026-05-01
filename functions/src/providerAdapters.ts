import {lookup} from 'dns/promises';
import {isIP} from 'net';
import * as functions from 'firebase-functions';

declare const fetch: (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
  }
) => Promise<{
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}>;

export type ProviderType =
  | 'openai'
  | 'openai_compatible'
  | 'anthropic'
  | 'google_gemini'
  | 'azure_openai'
  | 'mistral'
  | 'cohere'
  | 'groq'
  | 'together'
  | 'openrouter'
  | 'ollama_gateway'
  | 'custom_http'
  | 'aws_bedrock';

export type AuthType = 'bearer' | 'api_key' | 'basic';

export type ProviderAuth = {
  type: AuthType;
  value: string;
  headerName?: string;
};

export type NormalizedModel = {
  id: string;
  name: string;
  owner?: string;
  source: ProviderType;
  rawType?: string;
};

export type ProviderRequest = {
  providerType: ProviderType;
  baseUrl: string;
  auth: ProviderAuth;
  timeoutMs?: number;
};

export type SmokeTestResult = {
  modelId: string;
  ok: boolean;
  statusCode?: number;
  latencyMs: number;
  responsePreview?: string;
  error?: string;
};

type AdapterDefinition = {
  modelsPath: string;
  smokePath: (modelId: string) => string;
  buildModelsHeaders: (auth: ProviderAuth) => Record<string, string>;
  buildSmokeHeaders: (auth: ProviderAuth) => Record<string, string>;
  buildSmokeBody: (modelId: string) => Record<string, unknown>;
  parseModels: (payload: unknown, providerType: ProviderType) => NormalizedModel[];
  parseSmokePreview: (payload: unknown) => string;
};

const blockedHosts = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata',
  '169.254.169.254',
  '0.0.0.0',
]);

const providerDefaults: Record<ProviderType, Partial<AdapterDefinition> & {defaultBaseUrl?: string}> = {
  openai: {defaultBaseUrl: 'https://api.openai.com/v1'},
  openai_compatible: {},
  anthropic: {defaultBaseUrl: 'https://api.anthropic.com/v1'},
  google_gemini: {defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta'},
  azure_openai: {},
  mistral: {defaultBaseUrl: 'https://api.mistral.ai/v1'},
  cohere: {defaultBaseUrl: 'https://api.cohere.com/v2'},
  groq: {defaultBaseUrl: 'https://api.groq.com/openai/v1'},
  together: {defaultBaseUrl: 'https://api.together.xyz/v1'},
  openrouter: {defaultBaseUrl: 'https://openrouter.ai/api/v1'},
  ollama_gateway: {},
  custom_http: {},
  aws_bedrock: {},
};

function isPrivateHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (blockedHosts.has(host)) return true;
  if (host.endsWith('.local') || host.endsWith('.internal')) return true;
  return false;
}

function isPrivateIp(address: string): boolean {
  if (address === '::1') return true;
  if (address.startsWith('fc') || address.startsWith('fd') || address.startsWith('fe80')) return true;

  const parts = address.split('.').map((item) => Number(item));
  if (parts.length !== 4 || parts.some((item) => Number.isNaN(item))) return false;
  const [a, b] = parts;

  return a === 10
    || a === 127
    || a === 0
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || (a === 169 && b === 254);
}

export async function assertPublicHttpsUrl(rawUrl: string): Promise<URL> {
  const url = new URL(rawUrl);
  if (url.protocol !== 'https:') {
    throw new functions.https.HttpsError('invalid-argument', 'Provider URL must use HTTPS');
  }

  if (isPrivateHostname(url.hostname)) {
    throw new functions.https.HttpsError('invalid-argument', 'Provider URL cannot target internal hostnames');
  }

  if (isIP(url.hostname) && isPrivateIp(url.hostname)) {
    throw new functions.https.HttpsError('invalid-argument', 'Provider URL cannot target private IP ranges');
  }

  try {
    const resolved = await lookup(url.hostname, {all: true});
    if (resolved.some((item) => isPrivateIp(item.address))) {
      throw new functions.https.HttpsError('invalid-argument', 'Provider DNS resolves to a private IP range');
    }
  } catch (error) {
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError('invalid-argument', 'Provider URL DNS lookup failed');
  }

  return url;
}

function joinUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/+$/, '');
  const nextPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${nextPath}`;
}

function authHeaders(auth: ProviderAuth, providerType?: ProviderType): Record<string, string> {
  if (!auth.value || auth.value.length < 6) {
    throw new functions.https.HttpsError('invalid-argument', 'Provider API credential is required');
  }

  if (providerType === 'google_gemini') return {'x-goog-api-key': auth.value};

  if (auth.type === 'bearer') return {Authorization: `Bearer ${auth.value}`};
  if (auth.type === 'basic') return {Authorization: `Basic ${Buffer.from(auth.value).toString('base64')}`};

  return {[auth.headerName || 'x-api-key']: auth.value};
}

function parseDataArray(payload: unknown): unknown[] {
  if (!payload || typeof payload !== 'object') return [];
  const record = payload as Record<string, unknown>;
  if (Array.isArray(record.data)) return record.data;
  if (Array.isArray(record.models)) return record.models;
  if (Array.isArray(record.model)) return record.model;
  if (Array.isArray(record.items)) return record.items;
  return [];
}

function modelIdFrom(entry: unknown): string {
  if (typeof entry === 'string') return entry;
  if (!entry || typeof entry !== 'object') return '';
  const record = entry as Record<string, unknown>;
  return String(record.id || record.name || record.model || record.modelId || '').trim();
}

function ownerFrom(entry: unknown): string | undefined {
  if (!entry || typeof entry !== 'object') return undefined;
  const record = entry as Record<string, unknown>;
  const owner = record.owned_by || record.owner || record.publisher || record.provider || record.family;
  return owner ? String(owner) : undefined;
}

function defaultParseModels(payload: unknown, providerType: ProviderType): NormalizedModel[] {
  const models: NormalizedModel[] = [];
  for (const entry of parseDataArray(payload)) {
    const id = modelIdFrom(entry);
    if (!id) continue;
    models.push({
      id,
      name: id,
      owner: ownerFrom(entry),
      source: providerType,
      rawType: typeof entry === 'object' && entry ? String((entry as Record<string, unknown>).object || '') : undefined,
    });
  }
  return models;
}

function geminiParseModels(payload: unknown, providerType: ProviderType): NormalizedModel[] {
  const models: NormalizedModel[] = [];
  for (const entry of parseDataArray(payload)) {
    if (!entry || typeof entry !== 'object') continue;
    const record = entry as Record<string, unknown>;
    const rawName = String(record.name || '').replace(/^models\//, '');
    if (!rawName) continue;
    models.push({
      id: rawName,
      name: String(record.displayName || rawName),
      owner: 'google',
      source: providerType,
      rawType: String(record.version || ''),
    });
  }
  return models;
}

function ollamaParseModels(payload: unknown, providerType: ProviderType): NormalizedModel[] {
  const models: NormalizedModel[] = [];
  for (const entry of parseDataArray(payload)) {
    const id = modelIdFrom(entry);
    if (!id) continue;
    models.push({id, name: id, owner: 'ollama_gateway', source: providerType});
  }
  return models;
}

function textFromPayload(payload: unknown): string {
  const raw = JSON.stringify(payload);
  return raw.length > 600 ? `${raw.slice(0, 600)}...` : raw;
}

function openAiLikeAdapter(modelsPath = '/models'): AdapterDefinition {
  return {
    modelsPath,
    smokePath: () => '/chat/completions',
    buildModelsHeaders: (auth) => authHeaders(auth),
    buildSmokeHeaders: (auth) => ({
      ...authHeaders(auth),
      'Content-Type': 'application/json',
    }),
    buildSmokeBody: (modelId) => ({
      model: modelId,
      messages: [{role: 'user', content: 'Return the word BloomX.'}],
      max_tokens: 12,
      temperature: 0,
    }),
    parseModels: defaultParseModels,
    parseSmokePreview: textFromPayload,
  };
}

function adapterFor(providerType: ProviderType): AdapterDefinition {
  if (providerType === 'aws_bedrock') {
    throw new functions.https.HttpsError('failed-precondition', 'AWS Bedrock requires a dedicated SigV4 connector before production use');
  }

  if (['openai', 'openai_compatible', 'mistral', 'groq', 'together', 'openrouter', 'custom_http'].includes(providerType)) {
    return openAiLikeAdapter();
  }

  if (providerType === 'azure_openai') {
    return openAiLikeAdapter('/openai/models?api-version=2024-10-21');
  }

  if (providerType === 'anthropic') {
    return {
      modelsPath: '/models',
      smokePath: () => '/messages',
      buildModelsHeaders: (auth) => ({
        ...authHeaders(auth, 'anthropic'),
        'anthropic-version': '2023-06-01',
      }),
      buildSmokeHeaders: (auth) => ({
        ...authHeaders(auth, 'anthropic'),
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      }),
      buildSmokeBody: (modelId) => ({
        model: modelId,
        messages: [{role: 'user', content: 'Return the word BloomX.'}],
        max_tokens: 12,
      }),
      parseModels: defaultParseModels,
      parseSmokePreview: textFromPayload,
    };
  }

  if (providerType === 'google_gemini') {
    return {
      modelsPath: '/models',
      smokePath: (modelId) => `/models/${encodeURIComponent(modelId)}:generateContent`,
      buildModelsHeaders: (auth) => authHeaders(auth, 'google_gemini'),
      buildSmokeHeaders: (auth) => ({
        ...authHeaders(auth, 'google_gemini'),
        'Content-Type': 'application/json',
      }),
      buildSmokeBody: () => ({
        contents: [{parts: [{text: 'Return the word BloomX.'}]}],
        generationConfig: {temperature: 0, maxOutputTokens: 12},
      }),
      parseModels: geminiParseModels,
      parseSmokePreview: textFromPayload,
    };
  }

  if (providerType === 'cohere') {
    return {
      modelsPath: '/models',
      smokePath: () => '/chat',
      buildModelsHeaders: (auth) => authHeaders(auth),
      buildSmokeHeaders: (auth) => ({
        ...authHeaders(auth),
        'Content-Type': 'application/json',
      }),
      buildSmokeBody: (modelId) => ({
        model: modelId,
        messages: [{role: 'user', content: 'Return the word BloomX.'}],
        max_tokens: 12,
      }),
      parseModels: defaultParseModels,
      parseSmokePreview: textFromPayload,
    };
  }

  if (providerType === 'ollama_gateway') {
    return {
      modelsPath: '/api/tags',
      smokePath: () => '/api/chat',
      buildModelsHeaders: (auth) => auth.value ? authHeaders(auth) : {},
      buildSmokeHeaders: (auth) => ({
        ...(auth.value ? authHeaders(auth) : {}),
        'Content-Type': 'application/json',
      }),
      buildSmokeBody: (modelId) => ({
        model: modelId,
        messages: [{role: 'user', content: 'Return the word BloomX.'}],
        stream: false,
      }),
      parseModels: ollamaParseModels,
      parseSmokePreview: textFromPayload,
    };
  }

  throw new functions.https.HttpsError('invalid-argument', 'Unsupported provider type');
}

function normalizeBaseUrl(providerType: ProviderType, baseUrl: string): string {
  const fallback = providerDefaults[providerType]?.defaultBaseUrl;
  const resolved = String(baseUrl || fallback || '').trim();
  if (!resolved) {
    throw new functions.https.HttpsError('invalid-argument', 'Provider base URL is required');
  }
  return resolved;
}

async function fetchJson(url: string, init: {headers: Record<string, string>; body?: string; method?: string; timeoutMs?: number}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), init.timeoutMs || 30000);
  try {
    const response = await fetch(url, {
      method: init.method || 'GET',
      headers: init.headers,
      body: init.body,
      signal: controller.signal,
    });
    const text = await response.text();
    let payload: unknown = {};
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = {raw: text};
    }

    if (!response.ok) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Provider request failed with ${response.status}`,
        {statusCode: response.status, responsePreview: text.slice(0, 600)}
      );
    }

    return {statusCode: response.status, payload};
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchProviderModels(input: ProviderRequest): Promise<NormalizedModel[]> {
  const adapter = adapterFor(input.providerType);
  const baseUrl = normalizeBaseUrl(input.providerType, input.baseUrl);
  await assertPublicHttpsUrl(baseUrl);
  const result = await fetchJson(joinUrl(baseUrl, adapter.modelsPath), {
    headers: adapter.buildModelsHeaders(input.auth),
    timeoutMs: input.timeoutMs,
  });
  const models = adapter.parseModels(result.payload, input.providerType);

  if (models.length === 0) {
    throw new functions.https.HttpsError('failed-precondition', 'Provider returned no usable models');
  }

  return models;
}

export async function smokeTestProviderModel(input: ProviderRequest & {modelId: string}): Promise<SmokeTestResult> {
  const adapter = adapterFor(input.providerType);
  const baseUrl = normalizeBaseUrl(input.providerType, input.baseUrl);
  await assertPublicHttpsUrl(baseUrl);
  const startedAt = Date.now();

  try {
    const result = await fetchJson(joinUrl(baseUrl, adapter.smokePath(input.modelId)), {
      method: 'POST',
      headers: adapter.buildSmokeHeaders(input.auth),
      body: JSON.stringify(adapter.buildSmokeBody(input.modelId)),
      timeoutMs: input.timeoutMs,
    });

    return {
      modelId: input.modelId,
      ok: true,
      statusCode: result.statusCode,
      latencyMs: Date.now() - startedAt,
      responsePreview: adapter.parseSmokePreview(result.payload),
    };
  } catch (error) {
    const detail = error instanceof functions.https.HttpsError ? error.details as Record<string, unknown> | undefined : undefined;
    return {
      modelId: input.modelId,
      ok: false,
      statusCode: typeof detail?.statusCode === 'number' ? detail.statusCode : undefined,
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : 'Provider smoke test failed',
      responsePreview: typeof detail?.responsePreview === 'string' ? detail.responsePreview : undefined,
    };
  }
}

export const supportedProviderTypes: ProviderType[] = [
  'openai',
  'openai_compatible',
  'anthropic',
  'google_gemini',
  'azure_openai',
  'mistral',
  'cohere',
  'groq',
  'together',
  'openrouter',
  'ollama_gateway',
  'custom_http',
  'aws_bedrock',
];
