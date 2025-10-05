# Better Docs

Universal TypeScript framework documentation generator - works with Express, NestJS, Fastify, Koa and more.

## Quick Start

```bash
# Install
npm install -g @better-docs/universal

# Configure
better-docs config

# Set API key
export GOOGLE_AI_API_KEY="your_key_here"

# Generate docs
better-docs analyze ./your-project
```

## Documentation

📚 **[Complete Documentation](./docs/)**

-   **[Installation Guide](./docs/installation.md)** - How to install and setup
-   **[Configuration Guide](./docs/configuration.md)** - Configure AI providers and settings
-   **[Usage Guide](./docs/usage.md)** - Commands and workflow
-   **[Architecture](./docs/architecture.md)** - How it works internally
-   **[Examples](./docs/examples.md)** - Real project examples
-   **[Troubleshooting](./docs/troubleshooting.md)** - Common issues and solutions

## Features

-   🚀 **Universal**: Works with Express, NestJS, Fastify, Koa
-   🤖 **AI-Powered**: Generates human-readable documentation
-   📊 **Comprehensive**: Extracts routes, controllers, types, and dependencies
-   ⚡ **Fast**: Optimized for large TypeScript projects
-   🔧 **Configurable**: Multiple AI providers and output formats

## Supported Frameworks

-   **Express.js** - Route extraction and middleware analysis
-   **NestJS** - Controller, service, and module analysis
-   **Fastify** - Route and plugin analysis
-   **Koa** - Middleware and route analysis

## AI Providers

-   **Google AI** (Gemini)
-   **OpenAI** (GPT-4, GPT-3.5)
-   **Anthropic** (Claude)

## License

MIT
