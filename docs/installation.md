# Installation Guide

## Quick Install

```bash
npm install -g @better-docs/universal
```

## Local Install

```bash
npm install @better-docs/universal
```

## From Source

```bash
git clone https://github.com/better-hack/better-docs.git
cd better-docs
npm install
npm run build
npm link
```

## Requirements

-   **Node.js**: >= 16.0.0
-   **TypeScript**: Your project should use TypeScript
-   **Frameworks**: Express, NestJS, Fastify, or Koa

## Verify Installation

```bash
better-docs --version
```

Should output: `1.0.0`

## Next Steps

1. [Configure your project](./configuration.md)
2. [Generate documentation](./usage.md)
