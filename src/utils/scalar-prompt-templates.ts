export class ScalarPromptTemplates {
    static getOpenAPITemplate(): string {
        return `
✅ documents documentation saved to docs\test\documents.md
💾 documents documentation saved to MongoDB (Run ID: run-2025-10-05T09-58-49-657Z-bqk1ab)
📝 Generating documentation for latest module...
🔍 Sending request to AI... (Attempt 1/3)
✅ AI response received
📝 Response length: 5218 characters
✅ latest documentation saved to docs\test\latest.md
💾 latest documentation saved to MongoDB (Run ID: run-2025-10-05T09-58-49-657Z-bqk1ab)
📝 Generating documentation for run module...
🔍 Sending request to AI... (Attempt 1/3)
✅ AI response received
📝 Response length: 4555 characters
✅ run documentation saved to docs\test\run.md
💾 run documentation saved to MongoDB (Run ID: run-2025-10-05T09-58-49-657Z-bqk1ab)
📝 Generating documentation for count module...
🔍 Sending request to AI... (Attempt 1/3)
`
    }

    static buildOpenAPIPrompt(analysisData: any): string {
        const template = this.getOpenAPITemplate()
        return template.replace(
            '{{ANALYSIS_DATA}}',
            JSON.stringify(analysisData, null, 2)
        )
    }

    static getChunkedOpenAPITemplate(): string {
        return `
✅ documents documentation saved to docs\test\documents.md
💾 documents documentation saved to MongoDB (Run ID: run-2025-10-05T09-58-49-657Z-bqk1ab)
📝 Generating documentation for latest module...
🔍 Sending request to AI... (Attempt 1/3)
✅ AI response received
📝 Response length: 5218 characters
✅ latest documentation saved to docs\test\latest.md
💾 latest documentation saved to MongoDB (Run ID: run-2025-10-05T09-58-49-657Z-bqk1ab)
📝 Generating documentation for run module...
🔍 Sending request to AI... (Attempt 1/3)
✅ AI response received
📝 Response length: 4555 characters
✅ run documentation saved to docs\test\run.md
💾 run documentation saved to MongoDB (Run ID: run-2025-10-05T09-58-49-657Z-bqk1ab)
📝 Generating documentation for count module...
🔍 Sending request to AI... (Attempt 1/3)

`
    }

    static buildChunkedOpenAPIPrompt(analysisData: any): string {
        const template = this.getChunkedOpenAPITemplate()
        return template.replace(
            '{{ANALYSIS_DATA}}',
            JSON.stringify(analysisData, null, 2)
        )
    }
}
