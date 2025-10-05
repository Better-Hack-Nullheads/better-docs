#!/usr/bin/env node

import { Command } from 'commander'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { MongoDBAdapter } from './adapters/mongodb-adapter'
import { ConfigManager } from './config/config'
import { FrameworkDetector } from './core/framework-detector'
import { UniversalAnalyzer } from './core/universal-analyzer'
import { AIService } from './services/ai-service'
import { ScalarAIService } from './services/scalar-ai-service'

// Environment variables loaded by ConfigManager

const program = new Command()

// Initialize configuration
const configManager = ConfigManager.getInstance()

program
    .name('auto-doc-gen-universal')
    .description('Universal TypeScript framework documentation generator')
    .version('1.0.0')
    .option('-c, --config <file>', 'Configuration file path')
    .option('--verbose', 'Verbose output')
    .hook('preAction', (thisCommand) => {
        // Skip config check for config command itself
        const args = process.argv.slice(2)
        if (args[0] === 'config') {
            return
        }

        // Check if config file exists
        const configFile = thisCommand.getOptionValue('config')
        const configPaths = [
            configFile,
            './autodocgen.config.json',
            './.autodocgen.json',
            './autodocgen.json',
        ].filter(Boolean) as string[]

        const configExists = configPaths.some((path) => existsSync(path))

        if (!configExists) {
            console.log('❌ No configuration file found!')
            console.log('')
            console.log('📋 Please create a configuration file first:')
            console.log('   npx @auto-doc-gen/universal config')
            console.log('')
            console.log(
                '💡 This will generate autodocgen.config.json with default settings.'
            )
            console.log('   You can then edit it to match your needs.')
            process.exit(1)
        }

        // Load config file if specified
        if (configFile) {
            configManager.loadConfigFile(configFile)
        } else {
            configManager.loadConfigFile()
        }

        // Update verbose setting
        if (thisCommand.getOptionValue('verbose')) {
            configManager.updateConfig({ verbose: true })
        }
    })

program
    .command('analyze')
    .description('Analyze TypeScript project and extract documentation')
    .argument('<path>', 'Project path to analyze')
    .option('-o, --output <file>', 'Output file path')
    .option('-f, --framework <framework>', 'Force specific framework')
    .option('--ai', 'Generate AI documentation after analysis')
    .option('--save-to-db', 'Save analysis to MongoDB')
    .option('--provider <provider>', 'AI provider (google, openai, anthropic)')
    .option('--model <model>', 'AI model to use')
    .option('--api-key <key>', 'AI API key')
    .action(async (path, options) => {
        try {
            const config = configManager.getConfig()

            console.log(`🔍 Analyzing project: ${path}`)

            const analyzer = new UniversalAnalyzer(path)
            const result = await analyzer.analyze()

            if (config.verbose) {
                console.log('📊 Analysis Results:')
                console.log(`   Framework: ${result.framework}`)
                console.log(`   Routes: ${result.metadata.totalRoutes}`)
                console.log(
                    `   Controllers: ${result.metadata.totalControllers}`
                )
                console.log(`   Services: ${result.metadata.totalServices}`)
                console.log(`   Types: ${result.types.length}`)
                console.log(
                    `   Analysis Time: ${result.metadata.analysisTime}s`
                )
            }

            // Determine output file
            const outputFile =
                options.output ||
                (config.files.timestampFiles
                    ? `${config.files.analysisFilename.replace(
                          '.json',
                          ''
                      )}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
                    : config.files.analysisFilename)

            // Save raw analysis if enabled
            if (config.files.saveRawAnalysis) {
                writeFileSync(outputFile, JSON.stringify(result, null, 2))
                console.log(`✅ Analysis saved to ${outputFile}`)
            }

            // Save to MongoDB if requested or enabled in config
            if (options.saveToDb || config.database.enabled) {
                try {
                    const dbAdapter = new MongoDBAdapter(config.database)
                    await dbAdapter.connect()
                    await dbAdapter.saveAnalysis(result)
                    await dbAdapter.disconnect()
                    console.log('✅ Analysis saved to MongoDB')
                } catch (error) {
                    console.warn('⚠️ MongoDB save failed:', error)
                }
            }

            // Generate AI documentation if requested
            if (options.ai) {
                await generateAIDocumentation(result, options, config)
            }
        } catch (error) {
            console.error('❌ Analysis failed:', error)
            process.exit(1)
        }
    })

program
    .command('ai')
    .description('Generate AI documentation from analysis file')
    .argument('<input>', 'Analysis JSON file path')
    .option('-o, --output <file>', 'Output markdown file path')
    .option('--provider <provider>', 'AI provider (google, openai, anthropic)')
    .option('--model <model>', 'AI model to use')
    .option('--api-key <key>', 'AI API key')
    .option(
        '--template <template>',
        'Prompt template (default, security, performance, architecture)'
    )
    .option('--save-to-db', 'Save AI documentation to MongoDB')
    .action(async (input, options) => {
        try {
            if (!existsSync(input)) {
                console.error(`❌ Analysis file not found: ${input}`)
                process.exit(1)
            }

            const config = configManager.getConfig()
            const analysisData = JSON.parse(readFileSync(input, 'utf-8'))
            await generateAIDocumentation(analysisData, options, config)
        } catch (error) {
            console.error('❌ AI generation failed:', error)
            process.exit(1)
        }
    })

program
    .command('ai:chunks')
    .description(
        'Generate AI documentation in chunks for each module/controller'
    )
    .argument('<input>', 'Analysis JSON file path')
    .option('-o, --output-dir <dir>', 'Output directory for chunked docs')
    .option('--provider <provider>', 'AI provider (google, openai, anthropic)')
    .option('--model <model>', 'AI model to use')
    .option('--api-key <key>', 'AI API key')
    .option(
        '--template <template>',
        'Prompt template (default, security, performance, architecture)'
    )
    .option('--save-to-db', 'Save AI documentation to MongoDB')
    .action(async (input, options) => {
        try {
            if (!existsSync(input)) {
                console.error(`❌ Analysis file not found: ${input}`)
                process.exit(1)
            }

            const config = configManager.getConfig()
            const analysisData = JSON.parse(readFileSync(input, 'utf-8'))
            await generateChunkedAIDocumentation(analysisData, options, config)
        } catch (error) {
            console.error('❌ Chunked AI generation failed:', error)
            process.exit(1)
        }
    })

program
    .command('config')
    .description('Generate configuration file for auto-doc-gen')
    .option(
        '-o, --output <file>',
        'Output configuration file path',
        'autodocgen.config.json'
    )
    .option(
        '--template <template>',
        'Configuration template (basic, full, minimal)',
        'basic'
    )
    .option('--interactive', 'Interactive configuration setup')
    .action((options) => {
        try {
            const configTemplate = generateConfigTemplate(options.template)

            // Write config file
            writeFileSync(
                options.output,
                JSON.stringify(configTemplate, null, 2)
            )

            console.log(`✅ Configuration file generated: ${options.output}`)
            console.log('')
            console.log('📋 Next steps:')
            console.log('1. Edit the configuration file to match your needs')
            console.log(
                '2. Set your AI API key in the config or environment variables'
            )
            console.log(
                '3. Run: auto-doc-gen-universal analyze <your-project-path>'
            )
            console.log('')
            console.log('🔑 Environment variables you can set:')
            console.log('   GOOGLE_AI_API_KEY=your_key_here')
            console.log('   OPENAI_API_KEY=your_key_here')
            console.log('   ANTHROPIC_API_KEY=your_key_here')
        } catch (error) {
            console.error('❌ Failed to generate configuration:', error)
            process.exit(1)
        }
    })

program
    .command('config:validate')
    .description('Validate configuration file')
    .option(
        '-c, --config <file>',
        'Configuration file path',
        'autodocgen.config.json'
    )
    .action((options) => {
        try {
            const configManager = ConfigManager.getInstance()

            // Load the config file
            configManager.loadConfigFile(options.config)

            // Validate the configuration
            const validation = configManager.validateConfig()

            if (validation.valid) {
                console.log('✅ Configuration is valid!')
                console.log('')
                console.log('📋 Configuration Summary:')
                const config = configManager.getConfig()
                console.log(`   AI Provider: ${config.ai.provider}`)
                console.log(`   AI Model: ${config.ai.model}`)
                console.log(
                    `   API Key: ${config.ai.apiKey ? '✅ Set' : '❌ Not set'}`
                )
                console.log(
                    `   Database: ${
                        config.database.enabled ? '✅ Enabled' : '❌ Disabled'
                    }`
                )
                console.log(`   Output Directory: ${config.files.outputDir}`)
                console.log(
                    `   Verbose Mode: ${
                        config.verbose ? '✅ Enabled' : '❌ Disabled'
                    }`
                )
            } else {
                console.log('❌ Configuration validation failed:')
                console.log('')
                validation.errors.forEach((error, index) => {
                    console.log(`   ${index + 1}. ${error}`)
                })
                console.log('')
                console.log('💡 Fix these issues and run the validation again.')
                process.exit(1)
            }
        } catch (error) {
            console.error('❌ Failed to validate configuration:', error)
            process.exit(1)
        }
    })

program
    .command('detect')
    .description('Detect framework in project')
    .argument('<path>', 'Project path to analyze')
    .option('-v, --verbose', 'Verbose output')
    .action((path, options) => {
        try {
            console.log(`🔍 Detecting framework: ${path}`)

            const detector = new FrameworkDetector(path)
            const result = detector.detectFramework()

            console.log(`📋 Framework: ${result.framework}`)
            console.log(`🎯 Confidence: ${result.confidence}%`)

            if (options.verbose) {
                console.log('🔍 Indicators:')
                result.indicators.forEach((indicator) => {
                    console.log(`   - ${indicator}`)
                })
            }
        } catch (error) {
            console.error('❌ Detection failed:', error)
            process.exit(1)
        }
    })

async function generateAIDocumentation(
    analysisData: any,
    options: any,
    config: any
) {
    try {
        // Merge options with config and environment variables
        const aiConfig = {
            provider: options.provider || config.ai.provider,
            model: options.model || config.ai.model,
            apiKey:
                options.apiKey ||
                config.ai.apiKey ||
                getAPIKeyFromEnv(config.ai.provider),
            temperature: config.ai.temperature,
            maxTokens: config.ai.maxTokens,
        }

        if (!aiConfig.apiKey) {
            console.error(
                '❌ AI API key required. Set via --api-key, environment variable, or config file.'
            )
            process.exit(1)
        }

        console.log(
            `🤖 Generating AI documentation with ${aiConfig.provider}/${aiConfig.model}...`
        )

        const aiService = new AIService(aiConfig)
        const documentation = await aiService.analyzeProject(analysisData)

        // Create output directory if it doesn't exist
        if (!existsSync(config.files.outputDir)) {
            mkdirSync(config.files.outputDir, { recursive: true })
        }

        // Generate output filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const outputFile =
            options.output ||
            (config.files.timestampFiles
                ? join(config.files.outputDir, `ai-analysis-${timestamp}.md`)
                : join(config.files.outputDir, config.files.docsFilename))

        // Save AI documentation if enabled
        if (config.files.saveAIDocs) {
            writeFileSync(outputFile, documentation)
            console.log(`✅ AI documentation saved to ${outputFile}`)
        }

        // Save to MongoDB if requested or enabled in config
        if (options.saveToDb || config.database.enabled) {
            try {
                const dbAdapter = new MongoDBAdapter(config.database)
                await dbAdapter.connect()
                await dbAdapter.saveDocumentation({
                    content: documentation,
                    source: 'ai-generation',
                    provider: aiConfig.provider,
                    model: aiConfig.model,
                    timestamp: new Date().toISOString(),
                    metadata: {
                        framework: analysisData.framework,
                        totalRoutes: analysisData.metadata?.totalRoutes || 0,
                        totalControllers:
                            analysisData.metadata?.totalControllers || 0,
                    },
                })
                await dbAdapter.disconnect()
                console.log('✅ AI documentation saved to MongoDB')
            } catch (error) {
                console.warn('⚠️ MongoDB save failed:', error)
            }
        }
    } catch (error) {
        console.error('❌ AI documentation generation failed:', error)
        throw error
    }
}

async function generateChunkedAIDocumentation(
    analysisData: any,
    options: any,
    config: any
) {
    try {
        // Merge options with config and environment variables
        const aiConfig = {
            provider: options.provider || config.ai.provider,
            model: options.model || config.ai.model,
            apiKey:
                options.apiKey ||
                config.ai.apiKey ||
                getAPIKeyFromEnv(config.ai.provider),
            temperature: config.ai.temperature,
            maxTokens: config.ai.maxTokens,
        }

        if (!aiConfig.apiKey) {
            console.error(
                '❌ AI API key required. Set via --api-key, environment variable, or config file.'
            )
            process.exit(1)
        }

        console.log(
            `🤖 Generating chunked AI documentation with ${aiConfig.provider}/${aiConfig.model}...`
        )

        const aiService = new AIService(aiConfig)

        // Create output directory for chunks
        const outputDir =
            options.outputDir || join(config.files.outputDir, 'chunks')
        if (!existsSync(outputDir)) {
            mkdirSync(outputDir, { recursive: true })
        }

        // Group routes by controller/module
        const chunks = groupRoutesByController(
            analysisData.routes,
            analysisData.services,
            analysisData.controllers
        )

        console.log(
            `📦 Found ${Object.keys(chunks).length} modules to document`
        )

        // Generate documentation for each chunk
        for (const [moduleName, moduleData] of Object.entries(chunks)) {
            console.log(`📝 Generating documentation for ${moduleName}...`)

            // Get related services and types for this module
            const relatedServices = getRelatedServices(
                moduleName,
                analysisData.services
            )
            const relatedTypes = getRelatedTypes(moduleName, analysisData.types)

            const chunkData = {
                ...analysisData,
                routes: moduleData,
                services: relatedServices,
                types: relatedTypes,
                metadata: {
                    ...analysisData.metadata,
                    totalRoutes: moduleData.length,
                    totalServices: relatedServices.length,
                    totalTypes: relatedTypes.length,
                    moduleName: moduleName,
                },
            }

            // Save JSON analysis for this chunk
            const jsonFile = join(outputDir, `${moduleName}-analysis.json`)
            writeFileSync(jsonFile, JSON.stringify(chunkData, null, 2))
            console.log(`💾 ${moduleName} analysis saved to ${jsonFile}`)

            const documentation = await aiService.analyzeProject(chunkData)

            // Generate output filename for this chunk (no timestamp - overwrite)
            const outputFile = join(outputDir, `${moduleName}.md`)

            writeFileSync(outputFile, documentation)
            console.log(`✅ ${moduleName} documentation saved to ${outputFile}`)

            // Save to MongoDB if requested
            if (options.saveToDb || config.database.enabled) {
                try {
                    const dbAdapter = new MongoDBAdapter(config.database)
                    await dbAdapter.connect()
                    await dbAdapter.saveDocumentation({
                        content: documentation,
                        source: 'ai-generation-chunked',
                        provider: aiConfig.provider,
                        model: aiConfig.model,
                        timestamp: new Date().toISOString(),
                        metadata: {
                            framework: analysisData.framework,
                            moduleName: moduleName,
                            totalRoutes: moduleData.length,
                        },
                    })
                    await dbAdapter.disconnect()
                } catch (error) {
                    console.warn(
                        `⚠️ MongoDB save failed for ${moduleName}:`,
                        error
                    )
                }
            }
        }

        console.log(
            `🎉 Generated ${
                Object.keys(chunks).length
            } chunked documentation files in ${outputDir}`
        )
    } catch (error) {
        console.error('❌ Chunked AI documentation generation failed:', error)
        throw error
    }
}

function getRelatedServices(moduleName: string, services: any[]): any[] {
    return services.filter((service) => {
        const serviceName = service.name.toLowerCase()
        return (
            serviceName.includes(moduleName.toLowerCase()) ||
            (moduleName === 'app' && serviceName.includes('app'))
        )
    })
}

function getRelatedTypes(moduleName: string, types: any[]): any[] {
    return types.filter((type) => {
        const typeName = type.name.toLowerCase()
        return (
            typeName.includes(moduleName.toLowerCase()) ||
            (moduleName === 'app' && typeName.includes('app'))
        )
    })
}

function groupRoutesByController(
    routes: any[],
    services: any[] = [],
    controllers: any[] = []
): Record<string, any[]> {
    const chunks: Record<string, any[]> = {}

    // Extract module names from services (most reliable source)
    const serviceModules = new Map<string, string>()
    services.forEach((service) => {
        if (service.name) {
            const moduleName = extractModuleFromName(service.name)
            if (moduleName) {
                serviceModules.set(moduleName, service.name)
            }
        }
    })

    console.log(
        `🔍 Detected modules from services: ${Array.from(
            serviceModules.keys()
        ).join(', ')}`
    )

    // Group routes by controller (most accurate approach)
    controllers.forEach((controller) => {
        if (controller.name && controller.routes) {
            const moduleName = extractModuleFromName(controller.name)
            if (moduleName) {
                // Add all routes from this controller to the module
                controller.routes.forEach((route: any) => {
                    if (!chunks[moduleName]) {
                        chunks[moduleName] = []
                    }
                    chunks[moduleName]!.push(route)
                })
            }
        }
    })

    // If no controllers found, fallback to the old logic
    if (Object.keys(chunks).length === 0) {
        routes.forEach((route, index) => {
            let moduleName = 'unknown'

            // Strategy 1: Match routes to services based on handler patterns
            for (const [module, serviceName] of serviceModules) {
                const serviceBase = serviceName
                    .replace(/(Service|Controller)$/i, '')
                    .toLowerCase()

                if (
                    route.handler &&
                    route.handler.toLowerCase().includes(serviceBase)
                ) {
                    moduleName = module
                    break
                }
            }

            // Strategy 2: Extract module from route path (generic approach)
            if (moduleName === 'unknown') {
                if (route.path === '/' || route.path === '') {
                    moduleName = 'app'
                } else {
                    // Extract module name from the first path segment
                    const pathSegments = route.path
                        .split('/')
                        .filter(
                            (segment: string) =>
                                segment && !segment.startsWith(':')
                        )
                    if (pathSegments.length > 0) {
                        moduleName = pathSegments[0].toLowerCase()
                    } else {
                        // Strategy 3: Use route position as last resort
                        const routeGroup = Math.floor(index / 3)
                        const moduleNames = Array.from(serviceModules.keys())

                        if (routeGroup < moduleNames.length) {
                            moduleName = moduleNames[routeGroup] || 'app'
                        } else {
                            moduleName = 'app'
                        }
                    }
                }
            }

            // Sanitize module name for file system
            moduleName = moduleName.replace(/[^a-zA-Z0-9-_]/g, '_')

            if (!chunks[moduleName]) {
                chunks[moduleName] = []
            }
            chunks[moduleName]!.push(route)
        })
    }

    return chunks
}

function extractModuleFromName(name: string): string | null {
    if (!name) return null

    // Remove common suffixes like "Service", "Controller", "Dto", etc.
    const cleanName = name
        .replace(/(Service|Controller|Dto|Entity|Model|Type|Interface)$/i, '')
        .toLowerCase()

    // Convert to plural if it's a singular noun
    if (cleanName.endsWith('y')) {
        return cleanName.slice(0, -1) + 'ies'
    } else if (cleanName.endsWith('s')) {
        return cleanName
    } else {
        return cleanName + 's'
    }
}

function getAPIKeyFromEnv(provider: string): string {
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

// Generate unique run ID for versioning
function generateRunId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const random = Math.random().toString(36).substring(2, 8)
    return `run-${timestamp}-${random}`
}

// Scalar + AI Integration Commands
program
    .command('scalar-ai')
    .description('Generate AI documentation from Scalar OpenAPI spec')
    .argument('<openapi-path>', 'Path to OpenAPI spec file')
    .option('-o, --output <file>', 'Output file path')
    .action(async (openApiPath, options) => {
        try {
            console.log(
                '🤖 Generating AI documentation from Scalar OpenAPI spec...'
            )

            const config = configManager.getConfig()
            const aiService = new AIService(config.ai)
            const scalarAIService = new ScalarAIService(aiService)

            const enhancedDocs = await scalarAIService.generateEnhancedDocs(
                openApiPath
            )

            const outputPath = options.output || 'docs/scalar-ai-docs.md'
            writeFileSync(outputPath, enhancedDocs)

            console.log(`✅ Enhanced documentation saved to ${outputPath}`)
        } catch (error) {
            console.error(
                '❌ Scalar AI documentation generation failed:',
                error
            )
            process.exit(1)
        }
    })

program
    .command('generate')
    .description(
        'Generate chunked AI documentation from current project (default command)'
    )
    .argument(
        '[project-path]',
        'Path to project directory (default: current directory)'
    )
    .option(
        '-o, --output-dir <dir>',
        'Output directory for chunks',
        'docs/test'
    )
    .option('--save-to-db', 'Save AI documentation to MongoDB', true)
    .action(async (projectPath, options) => {
        try {
            // Use current directory if not provided
            const targetPath = projectPath || '.'

            console.log(
                '🤖 Generating chunked AI documentation from current project...'
            )

            const config = configManager.getConfig()
            const aiService = new AIService(config.ai)

            // Analyze the actual project
            const analyzer = new UniversalAnalyzer(targetPath)
            const analysisResult = await analyzer.analyze()

            // Transform to AI input format
            const aiInput = {
                framework: analysisResult.framework,
                routes: analysisResult.routes,
                controllers: analysisResult.controllers,
                services: analysisResult.services,
                types: analysisResult.types,
                metadata: {
                    totalRoutes: analysisResult.routes.length,
                    totalControllers: analysisResult.controllers.length,
                    totalServices: analysisResult.services.length,
                    totalTypes: analysisResult.types.length,
                    analysisTime: analysisResult.metadata.analysisTime,
                    source: 'project-analysis',
                },
            }

            // Create output directory
            const outputDir = options.outputDir || 'docs/chunks'
            if (!existsSync(outputDir)) {
                mkdirSync(outputDir, { recursive: true })
            }

            // Save the analysis data for inspection
            const analysisDataPath = join(outputDir, 'project-analysis.json')
            writeFileSync(
                analysisDataPath,
                JSON.stringify(analysisResult, null, 2)
            )
            console.log(`💾 Project analysis data saved to ${analysisDataPath}`)

            // Use controller-based grouping
            const chunks = groupRoutesByController(aiInput.routes)

            console.log(
                `📊 Found ${Object.keys(chunks).length} modules: ${Object.keys(
                    chunks
                ).join(', ')}`
            )

            // Generate one run ID and chunk timestamp for the entire execution
            const runId = generateRunId()
            const chunkTimestamp = new Date().toISOString()
            console.log(`🆔 Run ID: ${runId}`)
            console.log(`⏰ Chunk Timestamp: ${chunkTimestamp}`)

            // Generate documentation for each chunk
            for (const [moduleName, moduleRoutes] of Object.entries(chunks)) {
                console.log(
                    `📝 Generating documentation for ${moduleName} module...`
                )

                const moduleData = {
                    ...aiInput,
                    routes: moduleRoutes,
                    metadata: { ...aiInput.metadata, moduleName },
                }

                // Use standard prompt for project analysis
                const moduleDocs = await aiService.analyzeProject(moduleData)

                // Save documentation
                const docPath = join(outputDir, `${moduleName}.md`)
                writeFileSync(docPath, moduleDocs)

                // Save analysis data
                const analysisPath = join(
                    outputDir,
                    `${moduleName}-analysis.json`
                )
                writeFileSync(analysisPath, JSON.stringify(moduleData, null, 2))

                console.log(
                    `✅ ${moduleName} documentation saved to ${docPath}`
                )

                // Save to MongoDB if requested
                if (options.saveToDb || config.database.enabled) {
                    try {
                        const dbAdapter = new MongoDBAdapter(config.database)
                        await dbAdapter.connect()

                        // Use the same run ID and chunk timestamp for all modules in this execution
                        const timestamp = chunkTimestamp

                        await dbAdapter.saveDocumentation({
                            content: moduleDocs,
                            source: 'project-analysis-chunked',
                            provider: config.ai.provider,
                            model: config.ai.model,
                            timestamp: timestamp,
                            runId: runId, // Add run ID for versioning
                            metadata: {
                                framework: aiInput.framework,
                                moduleName: moduleName,
                                totalRoutes: moduleRoutes.length,
                                source: 'project-analysis',
                                runId: runId,
                                runTimestamp: timestamp,
                                chunkTimestamp: chunkTimestamp,
                                projectPath: targetPath,
                            },
                        })
                        await dbAdapter.disconnect()
                        console.log(
                            `💾 ${moduleName} documentation saved to MongoDB (Run ID: ${runId})`
                        )
                    } catch (error) {
                        console.warn(
                            `⚠️ MongoDB save failed for ${moduleName}:`,
                            error
                        )
                    }
                }
            }

            console.log(`🎉 Chunked documentation generation completed!`)
            console.log(`📁 Output directory: ${outputDir}`)
        } catch (error) {
            console.error(
                '❌ Scalar AI chunked documentation generation failed:',
                error
            )
            process.exit(1)
        }
    })

// Run management commands
program
    .command('runs:list')
    .description('List all documentation generation runs')
    .option('--limit <number>', 'Limit number of runs to show', '10')
    .action(async (options) => {
        try {
            const config = configManager.getConfig()
            const dbAdapter = new MongoDBAdapter(config.database)
            await dbAdapter.connect()

            // Get runs from database
            const runs = await dbAdapter.getRuns(parseInt(options.limit))

            console.log(`📊 Found ${runs.length} documentation runs:`)
            console.log('')

            runs.forEach((run, index) => {
                console.log(`${index + 1}. Run ID: ${run.runId}`)
                console.log(`   📅 Date: ${run.timestamp}`)
                console.log(
                    `   ⏰ Chunk Time: ${run.chunkTimestamp || 'Unknown'}`
                )
                console.log(`   🤖 Provider: ${run.provider}/${run.model}`)
                console.log(
                    `   📝 Modules: ${run.modules?.join(', ') || 'Unknown'}`
                )
                console.log(
                    `   📊 Total Routes: ${run.totalRoutes || 'Unknown'}`
                )
                console.log('')
            })

            await dbAdapter.disconnect()
        } catch (error) {
            console.error('❌ Failed to list runs:', error)
            process.exit(1)
        }
    })

program
    .command('runs:show <runId>')
    .description('Show details of a specific run')
    .action(async (runId) => {
        try {
            const config = configManager.getConfig()
            const dbAdapter = new MongoDBAdapter(config.database)
            await dbAdapter.connect()

            const run = await dbAdapter.getRunById(runId)

            if (!run) {
                console.error(`❌ Run not found: ${runId}`)
                process.exit(1)
            }

            console.log(`📊 Run Details: ${runId}`)
            console.log('')
            console.log(`📅 Date: ${run.timestamp}`)
            console.log(`⏰ Chunk Time: ${run.chunkTimestamp || 'Unknown'}`)
            console.log(`🤖 Provider: ${run.provider}/${run.model}`)
            console.log(`📝 Source: ${run.source}`)
            console.log(`📊 Total Routes: ${run.totalRoutes || 'Unknown'}`)
            console.log(`📁 Modules: ${run.modules?.join(', ') || 'Unknown'}`)
            console.log(`🔗 OpenAPI Spec: ${run.openApiSpecPath || 'Unknown'}`)
            console.log('')
            console.log('📄 Documentation:')
            console.log(run.content.substring(0, 500) + '...')

            await dbAdapter.disconnect()
        } catch (error) {
            console.error('❌ Failed to show run:', error)
            process.exit(1)
        }
    })

function generateConfigTemplate(template: string): any {
    const baseConfig = {
        ai: {
            provider: 'google',
            model: 'gemini-2.5-flash',
            apiKey: '', // Will be loaded from environment variables
            temperature: 0.7,
            maxTokens: 4000,
            customPrompt: undefined,
        },
        database: {
            enabled: false,
            type: 'mongodb',
            url: 'mongodb://localhost:27017/api_docs',
            database: 'api_docs',
            collections: {
                documentation: 'documentation',
                endpoints: 'endpoints',
                types: 'types',
            },
            mapping: {
                createCollections: true,
                includeTypeSchemas: true,
            },
        },
        files: {
            outputDir: './docs',
            analysisFilename: 'analysis.json',
            docsFilename: 'ai-analysis.md',
            saveRawAnalysis: true,
            saveAIDocs: true,
            timestampFiles: true,
        },
        framework: {
            autoDetect: true,
            forceFramework: undefined,
        },
        verbose: false,
    }

    switch (template) {
        case 'minimal':
            return {
                ai: {
                    provider: 'google',
                    model: 'gemini-2.5-flash',
                    apiKey: '', // Set via GOOGLE_AI_API_KEY environment variable
                },
                files: {
                    outputDir: './docs',
                },
            }

        case 'full':
            return {
                ...baseConfig,
                // Add additional advanced options for full template
                analysis: {
                    includeComments: true,
                    includeImports: false,
                    includePrivateMethods: false,
                    maxDepth: 5,
                },
                output: {
                    format: 'markdown',
                    includeExamples: true,
                    includeTypeDefinitions: true,
                    groupByModule: true,
                },
            }

        case 'basic':
        default:
            return baseConfig
    }
}

program.parse()
