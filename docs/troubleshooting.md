# Troubleshooting

This page lists common issues and their solutions when using Better Docs.

## No configuration file found!

This error occurs when you run a command without a `betterdocs.config.json` file in your project. To fix this, run the following command to generate a default configuration file:

```bash
npx @better-docs/universal config
```

## AI API key required

This error occurs when the AI provider's API key is not set. You can set the API key in your `betterdocs.config.json` file or as an environment variable (e.g., `GOOGLE_AI_API_KEY`).

## Analysis failed

This error can occur for various reasons, such as an invalid `tsconfig.json` file or a syntax error in your code. Check the verbose output for more details:

```bash
better-docs analyze ./my-project --verbose
```