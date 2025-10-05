# CLI Examples

Here are some practical examples of how to use the Better Docs CLI.

## Analyze a project and generate AI documentation

```bash
better-docs analyze ./my-project --ai
```

This command will analyze the project at `./my-project`, save the analysis to `analysis.json`, and then use the AI to generate documentation in `ai-analysis.md`.

## Generate chunked documentation

```bash
better-docs ai:chunks analysis.json --output-dir docs/chunks
```

This command will generate documentation for each module/controller in the `analysis.json` file and save them to the `docs/chunks` directory.

## Use a specific AI provider and model

```bash
better-docs ai analysis.json --provider openai --model gpt-4o
```

This command will use the OpenAI `gpt-4o` model to generate documentation.
