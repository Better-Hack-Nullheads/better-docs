# Database Integration

Better Docs can be configured to save analysis data and generated documentation to a MongoDB database.

## Configuration

To enable database integration, you need to configure the `database` section in your `betterdocs.config.json` file:

```json
{
  "database": {
    "enabled": true,
    "type": "mongodb",
    "url": "mongodb://localhost:27017/better-docs",
    "database": "better-docs",
    "collections": {
      "documentation": "documentation",
      "endpoints": "endpoints",
      "types": "types"
    }
  }
}
```

## Usage

Once configured, you can use the `--save-to-db` flag with the `analyze` and `ai` commands to save the data to your MongoDB database.

```bash
better-docs analyze ./my-project --save-to-db
```

## Schema

The MongoDB adapter creates the following collections:

-   `documentation`: Stores the generated documentation and analysis reports.
-   `endpoints`: Stores information about the extracted endpoints.
-   `types`: Stores information about the extracted types and interfaces.
