# Usage Guide

## Basic Commands

### 1. Generate Configuration

```bash
better-docs config
```

Creates `betterdocs.config.json` with default settings.

### 2. Analyze Your Project

```bash
better-docs analyze <project-path>
```

**Examples:**

```bash
# Analyze current directory
better-docs analyze .

# Analyze specific project
better-docs analyze /path/to/your/project

# With custom config
better-docs analyze . --config ./my-config.json
```

### 3. Validate Configuration

```bash
better-docs config:validate
```

## Command Options

### Global Options

```bash
better-docs [command] [options]

Options:
  -c, --config <file>    Configuration file path
  --verbose              Verbose output
  -h, --help             Display help
  -V, --version          Display version
```

### Analyze Command

```bash
better-docs analyze <path> [options]

Options:
  -o, --output <dir>     Output directory (overrides config)
  --format <format>      Output format (json, markdown)
  --watch                Watch for changes
```

## Output Files

After running `analyze`, you'll get:

```
docs/
├── analysis-2025-01-05T12-00-00.json    # Raw analysis data
├── ai-analysis-2025-01-05T12-00-00.md   # AI-generated docs
└── openapi.json                          # OpenAPI spec (if applicable)
```

## Workflow Example

```bash
# 1. Install
npm install -g @better-docs/universal

# 2. Configure
better-docs config

# 3. Set API key
export GOOGLE_AI_API_KEY="your_key_here"

# 4. Analyze
better-docs analyze ./my-express-app

# 5. Check results
ls docs/
```

## Troubleshooting

### Common Issues

**No configuration found:**

```bash
better-docs config
```

**API key not set:**

```bash
export GOOGLE_AI_API_KEY="your_key_here"
```

**Permission errors:**

```bash
sudo npm install -g @better-docs/universal
```

## Next Steps

-   [Understand the architecture](./architecture.md)
-   [View examples](./examples.md)
