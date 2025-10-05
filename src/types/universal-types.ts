// Universal types that work across all frameworks

export interface UniversalRoute {
    path: string
    method: string
    handler: string
    middleware: string[]
    parameters: Parameter[]
    framework: 'express' | 'nestjs' | 'fastify' | 'koa'
}

export interface Parameter {
    name: string
    type: string
    optional: boolean
    decorator?: string | undefined
}

export interface UniversalController {
    name: string
    routes: UniversalRoute[]
    framework: string
    filePath: string
}

export interface UniversalService {
    name: string
    methods: Method[]
    filePath: string
    framework: string
}

export interface Method {
    name: string
    parameters: Parameter[]
    returnType: string
    isPublic: boolean
}

export interface UniversalType {
    name: string
    type: 'interface' | 'class' | 'enum' | 'type'
    filePath: string
    properties: Property[]
}

export interface Property {
    name: string
    type: string
    optional: boolean
}

export interface AnalysisResult {
    framework: string
    routes: UniversalRoute[]
    controllers: UniversalController[]
    services: UniversalService[]
    types: UniversalType[]
    metadata: {
        totalRoutes: number
        totalControllers: number
        totalServices: number
        analysisTime: number
    }
}
