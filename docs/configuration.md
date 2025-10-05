# Configuration Guide

## Quick Setup

Generate a default configuration file:

```bash
better-docs config
```

This creates `betterdocs.config.json` with default settings.

## Configuration Options

### AI Provider Settings

```json
{
    "ai": {
        "provider": "google", // google, openai, anthropic
        "model": "gemini-2.5-flash", // Model name
        "apiKey": "", // Leave empty to use env vars
        "temperature": 0.7, // 0.0 - 1.0
        "maxTokens": 4000
    }
}
```

### Environment Variables

Set your API keys as environment variables:

```bash
# Google AI
export GOOGLE_AI_API_KEY="your_key_here"

# OpenAI
export OPENAI_API_KEY="your_key_here"

# Anthropic
export ANTHROPIC_API_KEY="your_key_here"
```

### Output Settings

```json
{
    "files": {
        "outputDir": "./docs", // Where to save docs
        "analysisFilename": "analysis.json",
        "docsFilename": "ai-analysis.md",
        "saveRawAnalysis": true, // Keep raw analysis
        "saveAIDocs": true, // Generate AI docs
        "timestampFiles": true // Add timestamps to files
    }
}
```

### Database (Optional)

```json
{
    "database": {
        "enabled": false, // Enable MongoDB storage
        "type": "mongodb",
        "url": "mongodb://localhost:27017/api_docs",
        "database": "api_docs"
    }
}
```

## Validate Configuration

```bash
better-docs config:validate
```

## Next Steps

-   [Learn how to use the commands](./usage.md)
-   [Understand the architecture](./architecture.md)
