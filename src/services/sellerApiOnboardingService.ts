import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../lib/firebase';

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

export type ProviderAuthType = 'bearer' | 'api_key' | 'basic';

export interface NormalizedModel {
  id: string;
  name: string;
  owner?: string;
  source: ProviderType;
  rawType?: string;
}

export interface SmokeTestResult {
  modelId: string;
  ok: boolean;
  statusCode?: number;
  latencyMs: number;
  responsePreview?: string;
  error?: string;
}

export interface ProviderApiInput {
  providerType: ProviderType;
  baseUrl: string;
  authType: ProviderAuthType;
  authValue: string;
  authHeaderName?: string;
}

export interface SubmitSellerApiProductInput extends ProviderApiInput {
  name: string;
  description: string;
  modelIds: string[];
  pricing: {
    input_per_1k: number;
    output_per_1k: number;
  };
}

const functions = getFunctions(app);

const fetchModelsCallable = httpsCallable<ProviderApiInput, {success: boolean; testLogId: string; models: NormalizedModel[]}>(
  functions,
  'fetchSellerApiModels',
);

const testModelsCallable = httpsCallable<ProviderApiInput & {modelIds: string[]}, {success: boolean; testLogId: string; results: SmokeTestResult[]}>(
  functions,
  'testSellerApiModels',
);

const submitProductCallable = httpsCallable<SubmitSellerApiProductInput, {
  success: boolean;
  productId: string;
  status: 'pending_review' | 'test_failed';
  testLogId: string;
  smokeResults: SmokeTestResult[];
}>(
  functions,
  'submitSellerApiProduct',
);

export async function fetchSellerApiModels(input: ProviderApiInput) {
  const result = await fetchModelsCallable(input);
  return result.data;
}

export async function testSellerApiModels(input: ProviderApiInput & {modelIds: string[]}) {
  const result = await testModelsCallable(input);
  return result.data;
}

export async function submitSellerApiProduct(input: SubmitSellerApiProductInput) {
  const result = await submitProductCallable(input);
  return result.data;
}
