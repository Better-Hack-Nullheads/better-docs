# How It Works

Better Docs works by analyzing your TypeScript codebase to extract metadata about your API, and then uses that metadata to generate documentation with the help of an AI provider.

## 1. Analysis

The `analyze` command is the first step in the process. It performs the following actions:

1.  **Framework Detection**: It detects the framework used in your project (e.g., Express, NestJS).
2.  **Code Parsing**: It uses `ts-morph` to parse your TypeScript code and build an Abstract Syntax Tree (AST).
3.  **Metadata Extraction**: It traverses the AST to extract information about:
    -   Routes and endpoints
    -   Controllers and their methods
    -   Services and their business logic
    -   Types and interfaces
4.  **Analysis Report**: The extracted metadata is compiled into a JSON file (`analysis.json` by default).

## 2. AI Documentation Generation

Once the analysis is complete, the `ai` command can be used to generate documentation. This command:

1.  **Reads the Analysis Report**: It loads the `analysis.json` file.
2.  **Builds a Prompt**: It constructs a prompt for the AI provider using the analysis data and a configurable template.
3.  **Generates Documentation**: It sends the prompt to the AI provider (e.g., Google Gemini) and receives the generated documentation in Markdown format.
4.  **Saves the Documentation**: The generated documentation is saved to a Markdown file (`ai-analysis.md` by default).
