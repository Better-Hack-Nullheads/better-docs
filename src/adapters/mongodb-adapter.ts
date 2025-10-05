import { Db, Document, InsertOneResult, MongoClient, WithId } from 'mongodb'

interface DatabaseConfig {
    type: string
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

interface DocumentationEntry {
    content: string
    source: string
    provider: string
    model: string
    timestamp: Date
    metadata: any
    createdAt: Date
    updatedAt: Date
}

interface AnalysisEntry {
    title: string
    description: string
    version: string
    framework: string
    createdAt: Date
    updatedAt: Date
    analysisData: any
}

interface EndpointEntry {
    path: string
    method: string
    controllerName: string
    methodName: string
    parameters: any[]
    documentationId: string
    summary: string
    tags: string[]
    framework: string
}

interface TypeSchemaEntry {
    name: string
    type: string
    definition: string
    documentationId: string
    framework: string
}

export class MongoDBAdapter {
    private client: MongoClient
    private db: Db
    private config: DatabaseConfig
    private isConnected: boolean = false

    constructor(config: DatabaseConfig) {
        this.config = config
        this.client = new MongoClient(config.url)
        this.db = this.client.db(config.database)
    }

    async connect(): Promise<void> {
        if (!this.isConnected) {
            await this.client.connect()
            this.isConnected = true
            await this.createCollections()
        }
    }

    async disconnect(): Promise<void> {
        if (this.isConnected) {
            await this.client.close()
            this.isConnected = false
        }
    }

    private async createCollections(): Promise<void> {
        if (!this.config.mapping.createCollections) return

        try {
            // Create documentation collection with proper indexes
            await this.db.createCollection(
                this.config.collections.documentation
            )
            const docCollection = this.db.collection(
                this.config.collections.documentation
            )
            await docCollection.createIndex({ timestamp: -1 })
            await docCollection.createIndex({ provider: 1, model: 1 })
            await docCollection.createIndex({ framework: 1 })
            await docCollection.createIndex({ 'metadata.totalControllers': 1 })

            // Create endpoints collection
            await this.db.createCollection(this.config.collections.endpoints)
            const endpointCollection = this.db.collection(
                this.config.collections.endpoints
            )
            await endpointCollection.createIndex({ path: 1, method: 1 })
            await endpointCollection.createIndex({ controllerName: 1 })
            await endpointCollection.createIndex({ documentationId: 1 })
            await endpointCollection.createIndex({ framework: 1 })

            // Create types collection if enabled
            if (this.config.mapping.includeTypeSchemas) {
                await this.db.createCollection(this.config.collections.types)
                const typesCollection = this.db.collection(
                    this.config.collections.types
                )
                await typesCollection.createIndex({ name: 1 })
                await typesCollection.createIndex({ documentationId: 1 })
                await typesCollection.createIndex({ framework: 1 })
            }
        } catch (error) {
            // Collections might already exist, which is fine
            console.warn(
                'Warning: Some collections might already exist:',
                error
            )
        }
    }

    async saveAnalysis(analysisData: any): Promise<void> {
        if (!this.isConnected) {
            throw new Error('Database not connected. Call connect() first.')
        }

        try {
            // Create documentation entry
            const documentation: AnalysisEntry = {
                title: 'Universal API Documentation',
                description: `Auto-generated API documentation for ${analysisData.framework} project`,
                version: '1.0.0',
                framework: analysisData.framework || 'unknown',
                createdAt: new Date(),
                updatedAt: new Date(),
                analysisData: analysisData,
            }

            const docResult: InsertOneResult = await this.db
                .collection(this.config.collections.documentation)
                .insertOne(documentation)

            const docId = docResult.insertedId.toString()

            // Save routes as endpoints
            const endpoints: EndpointEntry[] = []
            for (const route of analysisData.routes || []) {
                endpoints.push({
                    path: route.path || '/',
                    method: route.method || 'GET',
                    controllerName: route.handler || 'unknown',
                    methodName: route.handler || 'unknown',
                    parameters: route.parameters || [],
                    documentationId: docId,
                    summary: route.handler || 'Route handler',
                    tags: [route.handler || 'route'],
                    framework: analysisData.framework || 'unknown',
                })
            }

            // Save controllers as endpoints
            for (const controller of analysisData.controllers || []) {
                for (const route of controller.routes || []) {
                    endpoints.push({
                        path: route.path || '/',
                        method: route.method || 'GET',
                        controllerName: controller.name,
                        methodName: route.handler || 'unknown',
                        parameters: route.parameters || [],
                        documentationId: docId,
                        summary: route.handler || 'Controller method',
                        tags: [controller.name],
                        framework: analysisData.framework || 'unknown',
                    })
                }
            }

            if (endpoints.length > 0) {
                await this.db
                    .collection(this.config.collections.endpoints)
                    .insertMany(endpoints)
            }

            // Save types if enabled
            if (this.config.mapping.includeTypeSchemas && analysisData.types) {
                const typeSchemas: TypeSchemaEntry[] = analysisData.types.map(
                    (type: any) => ({
                        name: type.name,
                        type: type.type,
                        definition: JSON.stringify(type),
                        documentationId: docId,
                        framework: analysisData.framework || 'unknown',
                    })
                )

                if (typeSchemas.length > 0) {
                    await this.db
                        .collection(this.config.collections.types)
                        .insertMany(typeSchemas)
                }
            }
        } catch (error) {
            throw new Error(`Failed to save analysis: ${error}`)
        }
    }

    async saveDocumentation(docData: any): Promise<void> {
        if (!this.isConnected) {
            throw new Error('Database not connected. Call connect() first.')
        }

        try {
            const documentation: DocumentationEntry = {
                content: docData.content,
                source: docData.source,
                provider: docData.provider,
                model: docData.model,
                timestamp: new Date(docData.timestamp),
                metadata: docData.metadata,
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            await this.db
                .collection(this.config.collections.documentation)
                .insertOne(documentation)
        } catch (error) {
            throw new Error(`Failed to save documentation: ${error}`)
        }
    }

    // Legacy method for backward compatibility
    async close(): Promise<void> {
        await this.disconnect()
    }

    // Additional utility methods
    async getDocumentationCount(): Promise<number> {
        if (!this.isConnected) {
            throw new Error('Database not connected. Call connect() first.')
        }

        return await this.db
            .collection(this.config.collections.documentation)
            .countDocuments()
    }

    async getLatestDocumentation(
        limit: number = 10
    ): Promise<WithId<Document>[]> {
        if (!this.isConnected) {
            throw new Error('Database not connected. Call connect() first.')
        }

        return await this.db
            .collection(this.config.collections.documentation)
            .find({})
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray()
    }

    async getDocumentationByFramework(
        framework: string
    ): Promise<WithId<Document>[]> {
        if (!this.isConnected) {
            throw new Error('Database not connected. Call connect() first.')
        }

        return await this.db
            .collection(this.config.collections.documentation)
            .find({ framework })
            .sort({ timestamp: -1 })
            .toArray()
    }

    // Run management methods
    async getRuns(limit: number = 10): Promise<any[]> {
        if (!this.isConnected) {
            throw new Error('Database not connected. Call connect() first.')
        }

        return await this.db
            .collection(this.config.collections.documentation)
            .aggregate([
                {
                    $group: {
                        _id: '$runId',
                        runId: { $first: '$runId' },
                        timestamp: { $first: '$timestamp' },
                        provider: { $first: '$provider' },
                        model: { $first: '$model' },
                        source: { $first: '$source' },
                        modules: { $addToSet: '$metadata.moduleName' },
                        totalRoutes: { $sum: '$metadata.totalRoutes' },
                        chunkTimestamp: { $first: '$metadata.chunkTimestamp' },
                        openApiSpecPath: {
                            $first: '$metadata.openApiSpecPath',
                        },
                    },
                },
                { $sort: { timestamp: -1 } },
                { $limit: limit },
            ])
            .toArray()
    }

    async getRunById(runId: string): Promise<any> {
        if (!this.isConnected) {
            throw new Error('Database not connected. Call connect() first.')
        }

        const runs = await this.db
            .collection(this.config.collections.documentation)
            .find({ runId })
            .toArray()

        if (runs.length === 0) return null

        // Combine all modules for this run
        const combinedRun = {
            runId: runs[0]?.['runId'],
            timestamp: runs[0]?.['timestamp'],
            provider: runs[0]?.['provider'],
            model: runs[0]?.['model'],
            source: runs[0]?.['source'],
            modules: runs.map((r) => r['metadata']?.['moduleName']),
            totalRoutes: runs.reduce(
                (sum, r) => sum + (r['metadata']?.['totalRoutes'] || 0),
                0
            ),
            openApiSpecPath: runs[0]?.['metadata']?.['openApiSpecPath'],
            content: runs
                .map(
                    (r) =>
                        `## ${r['metadata']?.['moduleName']}\n\n${r['content']}`
                )
                .join('\n\n'),
        }

        return combinedRun
    }
}
