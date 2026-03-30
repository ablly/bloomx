# BloomX API Documentation

## Overview

BloomX provides a unified API gateway that is fully compatible with OpenAI's API format. You can use any OpenAI SDK or HTTP client to interact with BloomX.

## Base URL

```
https://api.bloomx.io/v1
```

## Authentication

All API requests require authentication using your BloomX API key in the `Authorization` header:

```
Authorization: Bearer bx_live_your_api_key_here
```

## Quick Start

### Using OpenAI SDK (Node.js)

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'bx_live_your_api_key_here',
  baseURL: 'https://api.bloomx.io/v1',
});

const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'user', content: 'Hello, BloomX!' }
  ],
});

console.log(response.choices[0].message.content);
```

### Using OpenAI SDK (Python)

```python
from openai import OpenAI

client = OpenAI(
    api_key="bx_live_your_api_key_here",
    base_url="https://api.bloomx.io/v1"
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "user", "content": "Hello, BloomX!"}
    ]
)

print(response.choices[0].message.content)
```

### Using cURL

```bash
curl https://api.bloomx.io/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer bx_live_your_api_key_here" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {
        "role": "user",
        "content": "Hello, BloomX!"
      }
    ]
  }'
```

## Supported Models

BloomX automatically routes your requests to the best available provider based on:
- Price
- Latency
- Availability
- Geographic location

### OpenAI Models
- `gpt-4o`
- `gpt-4o-mini`
- `gpt-4-turbo`
- `gpt-4`
- `gpt-3.5-turbo`

### Anthropic Models
- `claude-3-opus-20240229`
- `claude-3-sonnet-20240229`
- `claude-3-haiku-20240307`
- `claude-3-5-sonnet-20241022`

### Google Models
- `gemini-1.5-pro`
- `gemini-1.5-flash`
- `gemini-1.0-pro`

## API Endpoints

### Chat Completions

Create a chat completion.

**Endpoint:** `POST /v1/chat/completions`

**Request Body:**

```json
{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Hello!"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 1000,
  "stream": false
}
```

**Response:**

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-4o",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 9,
    "completion_tokens": 12,
    "total_tokens": 21
  }
}
```

### List Models

List all available models.

**Endpoint:** `GET /v1/models`

**Response:**

```json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-4o",
      "object": "model",
      "created": 1677610602,
      "owned_by": "openai"
    },
    {
      "id": "claude-3-opus-20240229",
      "object": "model",
      "created": 1677610602,
      "owned_by": "anthropic"
    }
  ]
}
```

### Get Usage

Get your current usage statistics.

**Endpoint:** `GET /v1/usage`

**Query Parameters:**
- `start_date` (optional): Start date in YYYY-MM-DD format
- `end_date` (optional): End date in YYYY-MM-DD format

**Response:**

```json
{
  "total_requests": 4200000,
  "total_tokens": 125000000,
  "total_cost": 1420.50,
  "by_model": {
    "gpt-4o": {
      "requests": 2800000,
      "tokens": 85000000,
      "cost": 842.10
    },
    "claude-3-opus-20240229": {
      "requests": 1000000,
      "tokens": 30000000,
      "cost": 312.40
    }
  }
}
```

### Get Credits Balance

Get your current credits balance.

**Endpoint:** `GET /v1/credits/balance`

**Response:**

```json
{
  "balance": 1420.50,
  "currency": "USD",
  "credits": 142050
}
```

## Streaming

BloomX supports streaming responses for real-time output.

### Example (Node.js)

```javascript
const stream = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Tell me a story' }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

### Example (Python)

```python
stream = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Tell me a story"}],
    stream=True
)

for chunk in stream:
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="")
```

## Rate Limits

BloomX implements intelligent rate limiting based on your account tier:

| Tier | Requests/min | Tokens/min | Concurrent Requests |
|------|--------------|------------|---------------------|
| Free | 60 | 40,000 | 3 |
| Starter | 300 | 200,000 | 10 |
| Pro | 1,000 | 1,000,000 | 50 |
| Enterprise | Custom | Custom | Custom |

## Error Handling

BloomX uses standard HTTP status codes and returns errors in OpenAI-compatible format.

### Error Response Format

```json
{
  "error": {
    "message": "Invalid API key provided",
    "type": "invalid_request_error",
    "code": "invalid_api_key"
  }
}
```

### Common Error Codes

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | invalid_request_error | Invalid request parameters |
| 401 | authentication_error | Invalid or missing API key |
| 403 | permission_error | Insufficient permissions |
| 429 | rate_limit_error | Rate limit exceeded |
| 500 | api_error | Internal server error |
| 503 | service_unavailable | Service temporarily unavailable |

### Example Error Handling (Node.js)

```javascript
try {
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Hello!' }],
  });
} catch (error) {
  if (error.status === 401) {
    console.error('Invalid API key');
  } else if (error.status === 429) {
    console.error('Rate limit exceeded');
  } else {
    console.error('API error:', error.message);
  }
}
```

## Best Practices

### 1. Secure Your API Keys

- Never commit API keys to version control
- Use environment variables
- Rotate keys regularly
- Use different keys for development and production

```javascript
// ✅ Good
const apiKey = process.env.BLOOMX_API_KEY;

// ❌ Bad
const apiKey = 'bx_live_abc123...';
```

### 2. Handle Rate Limits

Implement exponential backoff when hitting rate limits:

```javascript
async function makeRequestWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}
```

### 3. Monitor Usage

Regularly check your usage to avoid unexpected costs:

```javascript
const usage = await fetch('https://api.bloomx.io/v1/usage', {
  headers: {
    'Authorization': `Bearer ${apiKey}`
  }
});

const data = await usage.json();
console.log('Total cost:', data.total_cost);
```

### 4. Use Streaming for Long Responses

For better user experience, use streaming for long-form content:

```javascript
const stream = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Write a long essay' }],
  stream: true,
});
```

### 5. Set Reasonable Timeouts

Always set timeouts to prevent hanging requests:

```javascript
const client = new OpenAI({
  apiKey: 'bx_live_...',
  baseURL: 'https://api.bloomx.io/v1',
  timeout: 30000, // 30 seconds
});
```

## Pricing

BloomX uses a pay-as-you-go model with competitive pricing:

### Token Pricing (per 1M tokens)

| Model | Input | Output |
|-------|-------|--------|
| GPT-4o | $2.50 | $10.00 |
| GPT-4o-mini | $0.15 | $0.60 |
| Claude 3 Opus | $15.00 | $75.00 |
| Claude 3 Sonnet | $3.00 | $15.00 |
| Gemini 1.5 Pro | $1.25 | $5.00 |

### Credits System

- 1 Credit = $0.01 USD
- Minimum purchase: $10 (1,000 credits)
- No expiration
- Auto-recharge available

## Support

### Documentation
- API Docs: https://docs.bloomx.io
- Guides: https://bloomx.io/guides
- Examples: https://github.com/bloomx/examples

### Community
- Discord: https://discord.gg/bloomx
- GitHub: https://github.com/bloomx
- Twitter: @bloomx_ai

### Contact
- Email: support@bloomx.io
- Status: https://status.bloomx.io

## Changelog

### v1.0.0 (2026-03-29)
- Initial API release
- OpenAI-compatible endpoints
- Multi-provider routing
- Streaming support
- Usage tracking

---

**Need help?** Contact us at support@bloomx.io or join our [Discord community](https://discord.gg/bloomx).
