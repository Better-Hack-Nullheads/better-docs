# CLI Commands

Better Docs provides a set of commands to analyze your project and generate documentation.

## `analyze`

Analyzes a TypeScript project and extracts documentation.

```bash
better-docs analyze <path> [options]
```

-   `<path>`: The path to the project to analyze.
-   `--output <file>`: The output file path for the analysis report.
-   `--ai`: Generate AI documentation after analysis.
-   `--save-to-db`: Save the analysis to MongoDB.

## `ai`

Generates AI documentation from an analysis file.

```bash
better-docs ai <input> [options]
```

-   `<input>`: The path to the analysis JSON file.
-   `--output <file>`: The output file path for the generated documentation.

## `ai:chunks`

Generates AI documentation in chunks for each module/controller.

```bash
better-docs ai:chunks <input> [options]
```

-   `<input>`: The path to the analysis JSON file.
-   `--output-dir <dir>`: The output directory for the chunked documentation.

## `config`

Generates a configuration file for Better Docs.

```bash
better-docs config [options]
```

-   `--output <file>`: The output configuration file path.

## `config:validate`

Validates the configuration file.

```bash
better-docs config:validate [options]
```

-   `--config <file>`: The path to the configuration file.

## `detect`

Detects the framework in a project.

```bash
better-docs detect <path>
```

-   `<path>`: The path to the project to analyze.
