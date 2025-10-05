import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { AIConfig } from '../config/config'
import { PromptTemplates } from '../utils/prompt-templates'

export class AIService {
    private config: AIConfig

    constructor(config: AIConfig) {
        this.config = config
    }

    async analyzeProject(analysisData: any): Promise<string> {
        const prompt = this.buildPrompt(analysisData)
        return this.generateDocumentation(prompt)
    }

    async generateDocumentation(
        prompt: string,
        maxRetries: number = 3
    ): Promise<string> {
        const model = this.createModel()
        let lastError: Error | null = null

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(
                    `🔍 Sending request to AI... (Attempt ${attempt}/${maxRetries})`
                )

                const result = await generateText({
                    model: model as any,
                    prompt,
                    temperature: this.config.temperature || 0.7,
                    maxTokens: this.config.maxTokens || 4000,
                })

                console.log('✅ AI response received')
                console.log(
                    `📝 Response length: ${result.text?.length || 0} characters`
                )

                if (!result.text || result.text.trim().length === 0) {
                    console.log(
                        `⚠️ AI returned empty response (Attempt ${attempt}/${maxRetries})`
                    )

                    if (attempt < maxRetries) {
                        console.log(`🔄 Retrying in 2 seconds...`)
                        await new Promise((resolve) =>
                            setTimeout(resolve, 2000)
                        )
                        continue
                    } else {
                        // Fallback: Generate minimal documentation
                        console.log(
                            `🆘 All retries failed, generating fallback documentation...`
                        )
                        return this.generateFallbackDocumentation(prompt)
                    }
                }

                return result.text
            } catch (error) {
                lastError =
                    error instanceof Error ? error : new Error('Unknown error')
                console.error(
                    `❌ AI Service Error (Attempt ${attempt}/${maxRetries}):`,
                    lastError.message
                )

                if (attempt < maxRetries) {
                    console.log(`🔄 Retrying in 2 seconds...`)
                    await new Promise((resolve) => setTimeout(resolve, 2000))
                }
            }
        }

        throw new Error(
            `AI analysis failed after ${maxRetries} attempts: ${
                lastError?.message || 'Unknown error'
            }`
        )
    }

    private createModel() {
        const { provider, model, apiKey } = this.config

        switch (provider) {
            case 'google':
                // Google AI SDK expects GOOGLE_GENERATIVE_AI_API_KEY environment variable
                if (apiKey) {
                    process.env['GOOGLE_GENERATIVE_AI_API_KEY'] = apiKey
                }
                return google(model)
            case 'openai':
                // OpenAI SDK expects OPENAI_API_KEY environment variable
                if (apiKey) {
                    process.env['OPENAI_API_KEY'] = apiKey
                }
                return openai(model)
            case 'anthropic':
                // Anthropic SDK expects ANTHROPIC_API_KEY environment variable
                if (apiKey) {
                    process.env['ANTHROPIC_API_KEY'] = apiKey
                }
                return anthropic(model)
            default:
                throw new Error(`Unsupported AI provider: ${provider}`)
        }
    }

    private buildPrompt(analysisData: any): string {
        // Use custom prompt if provided in config
        if (this.config.customPrompt && this.config.customPrompt.trim()) {
            return PromptTemplates.buildPrompt(
                this.config.customPrompt,
                analysisData
            )
        }

        // Use default template
        const template = PromptTemplates.getDefaultTemplate()
        return PromptTemplates.buildPrompt(template, analysisData)
    }

    static getAvailableProviders(): string[] {
        return ['google', 'openai', 'anthropic']
    }

    static getAvailableModels(provider: string): string[] {
        switch (provider) {
            case 'google':
                return [
                    'gemini-2.5-flash',
                    'gemini-2.5-pro',
                    'gemini-1.5-flash',
                ]
            case 'openai':
                return ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo']
            case 'anthropic':
                return ['claude-3-5-sonnet', 'claude-3-haiku', 'claude-3-opus']
            default:
                return []
        }
    }

    private generateFallbackDocumentation(prompt: string): string {
        console.log('📝 Generating fallback documentation...')

        try {
            // Try to extract basic info from the prompt
            const promptLower = prompt.toLowerCase()
            let framework = 'Unknown'
            let moduleName = 'Module'

            if (promptLower.includes('nestjs')) framework = 'NestJS'
            else if (promptLower.includes('express')) framework = 'Express'
            else if (promptLower.includes('fastify')) framework = 'Fastify'
            else if (promptLower.includes('koa')) framework = 'Koa'

            // Extract module name from prompt if possible
            const moduleMatch = prompt.match(/module[:\s]+(\w+)/i)
            if (moduleMatch && moduleMatch[1]) {
                moduleName = moduleMatch[1]
            }

            return `# ${moduleName} Module Documentation

## Overview
This is a ${framework} module that provides API functionality.

## Status
⚠️ **Auto-generated fallback documentation** - AI service returned empty responses.

## Framework
- **Framework**: ${framework}
- **Module**: ${moduleName}

## Note
This documentation was generated as a fallback when the AI service failed to provide detailed analysis. 
Please check the AI service configuration and try regenerating the documentation.

---
*Generated by Better Docs with fallback mechanism*`
        } catch (error) {
            return `# Module Documentation

## Status
⚠️ **Fallback documentation** - AI service unavailable.

## Note
The AI service failed to generate documentation. This is a minimal fallback response.

---
*Generated by Better Docs*`
        }
    }
}
