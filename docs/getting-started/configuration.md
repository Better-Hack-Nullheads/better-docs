# Configuration

Better Docs uses a `betterdocs.config.json` file to configure its behavior. You can generate a default configuration file by running:

```bash
npx @better-docs/universal config
```

This will create a `betterdocs.config.json` file in your project root. You can then customize this file to your needs.

## Configuration Options

The following options are available in the configuration file:

-   `ai`: AI provider and model settings.
-   `database`: MongoDB connection and collection settings.
-   `files`: Output directory and file naming conventions.
-   `framework`: Framework detection settings.
-   `verbose`: Enable verbose logging.
