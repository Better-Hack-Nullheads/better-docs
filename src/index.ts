// Main exports for @auto-doc-gen/universal

export { MongoDBAdapter } from './adapters/mongodb-adapter'
export { ConfigManager } from './config/config'
export { FrameworkDetector } from './core/framework-detector'
export { UniversalAnalyzer } from './core/universal-analyzer'
export { ExpressExtractor } from './extractors/express/express-extractor'
export { GenericExtractor } from './extractors/generic/generic-extractor'
export { AIService } from './services/ai-service'
export { PromptTemplates } from './utils/prompt-templates'

export * from './types/universal-types'
