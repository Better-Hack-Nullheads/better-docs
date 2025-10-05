import { config } from 'dotenv'
import { existsSync } from 'fs'
import { join } from 'path'

// Load .env from current working directory (where the command is run)
const envPath = join(process.cwd(), '.env')
if (existsSync(envPath)) {
    const result = config({ path: envPath, override: true })
    if (result.parsed) {
        console.log(`✅ Loaded environment from: ${envPath}`)
        console.log(
            `🔑 GOOGLE_AI_API_KEY: ${
                process.env['GOOGLE_AI_API_KEY'] ? 'FOUND' : 'NOT FOUND'
            }`
        )
    } else {
        console.log(`⚠️ Failed to parse .env file at: ${envPath}`)
    }
} else {
    console.log(`⚠️ No .env file found at: ${envPath}`)
}

export interface AIConfig {
    provider: 'google' | 'openai' | 'anthropic'
    model: string
    apiKey: string
    temperature?: number
    maxTokens?: number
    customPrompt?: string | undefined
}

export interface DatabaseConfig {
    enabled: boolean
    type: 'mongodb'
    url: string
    database: string
    collections: {
        documentation: string
        endpoints: string
        types: string
    }
    mapping: {
        createCollections: boolean
        includeTypeSchemas: boolean
    }
}

export interface FileConfig {
    outputDir: string
    analysisFilename: string
    docsFilename: string
    saveRawAnalysis: boolean
    saveAIDocs: boolean
    timestampFiles: boolean
}

export interface UniversalConfig {
    ai: AIConfig
    database: DatabaseConfig
    files: FileConfig
    framework: {
        autoDetect: boolean
        forceFramework?: string | undefined
    }
    verbose: boolean
}

export class ConfigManager {
    private static instance: ConfigManager
    private config: UniversalConfig

    private constructor() {
        this.config = this.loadConfig()
    }

    public static getInstance(): ConfigManager {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager()
        }
        return ConfigManager.instance
    }

    public getConfig(): UniversalConfig {
        return this.config
    }

    public updateConfig(updates: Partial<UniversalConfig>): void {
        this.config = { ...this.config, ...updates }
    }

    private loadConfig(): UniversalConfig {
        return {
            ai: this.loadAIConfig(),
            database: this.loadDatabaseConfig(),
            files: this.loadFileConfig(),
            framework: this.loadFrameworkConfig(),
            verbose: process.env['AUTODOCGEN_VERBOSE'] === 'true' || false,
        }
    }

    private loadAIConfig(): AIConfig {
        const provider =
            (process.env['AUTODOCGEN_AI_PROVIDER'] as
                | 'google'
                | 'openai'
                | 'anthropic') || 'google'

        return {
            provider,
            model: this.getModelForProvider(provider),
            apiKey: this.getAPIKeyForProvider(provider),
            temperature: parseFloat(
                process.env['AUTODOCGEN_AI_TEMPERATURE'] || '0.7'
            ),
            maxTokens: parseInt(
                process.env['AUTODOCGEN_AI_MAX_TOKENS'] || '4000'
            ),
            customPrompt: process.env['AUTODOCGEN_AI_CUSTOM_PROMPT'],
        }
    }

    private getModelForProvider(provider: string): string {
        switch (provider) {
            case 'google':
                return (
                    process.env['AUTODOCGEN_GOOGLE_MODEL'] || 'gemini-2.5-flash'
                )
            case 'openai':
                return process.env['AUTODOCGEN_OPENAI_MODEL'] || 'gpt-4o'
            case 'anthropic':
                return (
                    process.env['AUTODOCGEN_ANTHROPIC_MODEL'] ||
                    'claude-3-5-sonnet'
                )
            default:
                return 'gemini-2.5-flash'
        }
    }

    private getAPIKeyForProvider(provider: string): string {
        switch (provider) {
            case 'google':
                return (
                    process.env['GOOGLE_AI_API_KEY'] ||
                    process.env['GOOGLE_GENERATIVE_AI_API_KEY'] ||
                    process.env['AUTODOCGEN_GOOGLE_API_KEY'] ||
                    ''
                )
            case 'openai':
                return (
                    process.env['OPENAI_API_KEY'] ||
                    process.env['AUTODOCGEN_OPENAI_API_KEY'] ||
                    ''
                )
            case 'anthropic':
                return (
                    process.env['ANTHROPIC_API_KEY'] ||
                    process.env['AUTODOCGEN_ANTHROPIC_API_KEY'] ||
                    ''
                )
            default:
                return ''
        }
    }

    private loadDatabaseConfig(): DatabaseConfig {
        return {
            enabled: process.env['AUTODOCGEN_DB_ENABLED'] === 'true' || false,
            type: 'mongodb',
            url:
                process.env['AUTODOCGEN_DB_URL'] ||
                process.env['MONGODB_URL'] ||
                'mongodb://localhost:27017/api_docs',
            database: process.env['AUTODOCGEN_DB_NAME'] || 'api_docs',
            collections: {
                documentation:
                    process.env['AUTODOCGEN_DB_DOCS_COLLECTION'] ||
                    'documentation',
                endpoints:
                    process.env['AUTODOCGEN_DB_ENDPOINTS_COLLECTION'] ||
                    'endpoints',
                types: process.env['AUTODOCGEN_DB_TYPES_COLLECTION'] || 'types',
            },
            mapping: {
                createCollections:
                    process.env['AUTODOCGEN_DB_CREATE_COLLECTIONS'] !== 'false',
                includeTypeSchemas:
                    process.env['AUTODOCGEN_DB_INCLUDE_TYPES'] !== 'false',
            },
        }
    }

    private loadFileConfig(): FileConfig {
        return {
            outputDir: process.env['AUTODOCGEN_OUTPUT_DIR'] || './docs',
            analysisFilename:
                process.env['AUTODOCGEN_ANALYSIS_FILENAME'] || 'analysis.json',
            docsFilename:
                process.env['AUTODOCGEN_DOCS_FILENAME'] || 'ai-analysis.md',
            saveRawAnalysis: process.env['AUTODOCGEN_SAVE_RAW'] !== 'false',
            saveAIDocs: process.env['AUTODOCGEN_SAVE_AI_DOCS'] !== 'false',
            timestampFiles:
                process.env['AUTODOCGEN_TIMESTAMP_FILES'] !== 'false',
        }
    }

    private loadFrameworkConfig() {
        return {
            autoDetect: process.env['AUTODOCGEN_AUTO_DETECT'] !== 'false',
            forceFramework: process.env['AUTODOCGEN_FORCE_FRAMEWORK'],
        }
    }

    public loadConfigFile(configPath?: string): void {
        const paths = [
            configPath,
            './autodocgen.config.json',
            './.autodocgen.json',
            './autodocgen.json',
        ].filter(Boolean) as string[]

        for (const path of paths) {
            if (existsSync(path)) {
                try {
                    const configData = require(join(process.cwd(), path))
                    this.mergeConfigFromFile(configData)
                    break
                } catch (error) {
                    console.warn(
                        `Warning: Could not load config file ${path}:`,
                        error
                    )
                }
            }
        }
    }

    private mergeConfigFromFile(configData: any): void {
        if (configData.ai) {
            this.config.ai = { ...this.config.ai, ...configData.ai }
        }
        if (configData.database) {
            this.config.database = {
                ...this.config.database,
                ...configData.database,
            }
        }
        if (configData.files) {
            this.config.files = { ...this.config.files, ...configData.files }
        }
        if (configData.framework) {
            this.config.framework = {
                ...this.config.framework,
                ...configData.framework,
            }
        }
    }

    public validateConfig(): { valid: boolean; errors: string[] } {
        const errors: string[] = []

        // Validate AI config
        if (!this.config.ai.apiKey) {
            errors.push(
                'AI API key is required. Set via environment variable or config file.'
            )
        }

        // Validate database config if enabled
        if (this.config.database.enabled && !this.config.database.url) {
            errors.push('Database URL is required when database is enabled.')
        }

        return {
            valid: errors.length === 0,
            errors,
        }
    }

    public getAvailableProviders(): string[] {
        return ['google', 'openai', 'anthropic']
    }

    public getAvailableModels(provider: string): string[] {
        switch (provider) {
            case 'google':
                return [
                    'gemini-2.5-flash',
                    'gemini-2.5-pro',
                    'gemini-1.5-flash',
                    'gemini-1.5-pro',
                ]
            case 'openai':
                return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
            case 'anthropic':
                return ['claude-3-5-sonnet', 'claude-3-haiku', 'claude-3-opus']
            default:
                return []
        }
    }
}
