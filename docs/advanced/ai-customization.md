# AI Customization

Better Docs allows you to customize the prompts used to generate AI documentation.

## Custom Prompt

You can provide a custom prompt in your `betterdocs.config.json` file using the `customPrompt` option in the `ai` configuration:

```json
{
  "ai": {
    "provider": "google",
    "model": "gemini-2.5-flash",
    "customPrompt": "You are a pirate. Write the documentation in a pirate voice."
  }
}
```

## Prompt Templates

The `prompt-templates.ts` file contains the default prompt templates used by Better Docs. You can modify these templates to change the structure and content of the generated documentation.

### Default Template

The default template is designed to be simple and clear. It includes sections for the overview, framework, endpoints, services, and types.

### Scalar Prompt Templates

The `scalar-prompt-templates.ts` file contains templates specifically for generating documentation from Scalar OpenAPI specifications.
