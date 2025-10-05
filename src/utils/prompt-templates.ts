export class PromptTemplates {
    static getDefaultTemplate(): string {
        return `
        You are a technical writer. Generate API documentation in Markdown format.

        Given the project analysis data, create clear documentation that includes:

        1. **Title and Overview** - Brief description of the API
        2. **Framework Information** - What framework is used (NestJS, Express, etc.)
        3. **Endpoints** - List all available routes with HTTP methods
        4. **Services** - Describe the business logic services
        5. **Types** - Document the data structures

        Keep it simple and clear. Use standard Markdown formatting.

        Example structure:
        # API Documentation

        ## Overview
        Brief description of what this API does.

        ## Framework
        This API is built with [Framework Name].

        ## Endpoints
        List the available routes and their methods.

        ## Services
        Describe the main services and their functionality.

        ## Types
        Document the main data types used.

        Now analyze the provided data and generate documentation.
        `
    }

    static buildPrompt(template: string, analysisData: any): string {
        const dataString = JSON.stringify(analysisData, null, 2)
        return `${template}

        Here is the project analysis data:

        ${dataString}

        Generate the documentation now.`
    }
}


