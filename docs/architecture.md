# Architecture Overview

## System Flow

```
TypeScript Project → Framework Detection → Code Analysis → AI Processing → Documentation
```

## Core Components

### 1. Framework Detector

-   **Purpose**: Automatically detects Express, NestJS, Fastify, or Koa
-   **Location**: `src/core/framework-detector.ts`
-   **Output**: Framework type and configuration

### 2. Universal Analyzer

-   **Purpose**: Extracts controllers, routes, services, and types
-   **Location**: `src/core/universal-analyzer.ts`
-   **Features**:
    -   Route extraction
    -   Type analysis
    -   Dependency mapping

### 3. Extractors

-   **Express Extractor**: `src/extractors/express/`
-   **Generic Extractor**: `src/extractors/generic/`
-   **Purpose**: Framework-specific code parsing

### 4. AI Service

-   **Purpose**: Generates human-readable documentation
-   **Location**: `src/services/ai-service.ts`
-   **Providers**: Google AI, OpenAI, Anthropic

### 5. Data Services

-   **MongoDB Adapter**: `src/adapters/mongodb-adapter.ts`
-   **Purpose**: Optional database storage

## Data Flow

```
1. CLI receives project path
2. Framework detector identifies framework
3. Appropriate extractor analyzes code
4. Universal analyzer processes results
5. AI service generates documentation
6. Files saved to output directory
```

## File Structure

```
src/
├── cli.ts                 # Command-line interface
├── index.ts              # Main exports
├── config/
│   └── config.ts         # Configuration management
├── core/
│   ├── framework-detector.ts
│   └── universal-analyzer.ts
├── extractors/
│   ├── express/
│   └── generic/
├── services/
│   ├── ai-service.ts
│   └── scalar-ai-service.ts
├── adapters/
│   └── mongodb-adapter.ts
├── types/
│   └── universal-types.ts
└── utils/
    ├── prompt-templates.ts
    └── scalar-prompt-templates.ts
```

## Configuration System

-   **File**: `betterdocs.config.json`
-   **Manager**: `ConfigManager` class
-   **Features**: Environment variable support, validation

## Output Formats

1. **Raw Analysis**: JSON with extracted metadata
2. **AI Documentation**: Markdown with explanations
3. **OpenAPI Spec**: Standard API documentation

## Extensibility

-   **New Frameworks**: Add extractors in `src/extractors/`
-   **AI Providers**: Extend `ai-service.ts`
-   **Output Formats**: Modify templates in `src/utils/`

## Next Steps

-   [Installation Guide](./installation.md)
-   [Configuration Guide](./configuration.md)
-   [Usage Guide](./usage.md)
