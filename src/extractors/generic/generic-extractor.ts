import {
    ClassDeclaration,
    MethodDeclaration,
    Project,
    SourceFile,
} from 'ts-morph'
import {
    Parameter,
    UniversalController,
    UniversalRoute,
    UniversalService,
    UniversalType,
} from '../../types/universal-types'

export class GenericExtractor {
    private project: Project

    constructor(projectPath: string) {
        this.project = new Project({
            tsConfigFilePath: `${projectPath}/tsconfig.json`,
        })
    }

    extractAll(): {
        routes: UniversalRoute[]
        controllers: UniversalController[]
        services: UniversalService[]
        types: UniversalType[]
    } {
        const sourceFiles = this.project.getSourceFiles()
        const routes: UniversalRoute[] = []
        const controllers: UniversalController[] = []
        const services: UniversalService[] = []
        const types: UniversalType[] = []

        for (const sourceFile of sourceFiles) {
            if (this.shouldSkipFile(sourceFile)) continue

            // Extract controllers (classes with methods) - this gives us the most accurate routes
            const fileControllers = this.extractControllers(sourceFile)
            controllers.push(...fileControllers)

            // Extract routes from controllers (more accurate than regex)
            fileControllers.forEach((controller) => {
                routes.push(...controller.routes)
            })

            // Fallback: Extract routes from any pattern for non-controller routes
            routes.push(...this.extractRoutes(sourceFile))

            // Extract services (classes with business logic)
            services.push(...this.extractServices(sourceFile))

            // Extract types (interfaces, types, enums)
            types.push(...this.extractTypes(sourceFile))
        }

        return { routes, controllers, services, types }
    }

    private extractRoutes(sourceFile: SourceFile): UniversalRoute[] {
        const routes: UniversalRoute[] = []
        const text = sourceFile.getFullText()

        // Generic route patterns that work across frameworks
        const routePatterns = [
            // Express patterns
            /app\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`],\s*([^,)]+)/g,
            /router\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`],\s*([^,)]+)/g,

            // NestJS patterns
            /@(Get|Post|Put|Delete|Patch)\(['"`]([^'"`]*)['"`]\)/g,

            // Fastify patterns
            /fastify\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`],\s*([^,)]+)/g,

            // Koa patterns
            /router\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`],\s*([^,)]+)/g,
        ]

        for (const pattern of routePatterns) {
            let match
            while ((match = pattern.exec(text)) !== null) {
                const method = this.extractMethod(match)
                const path = this.extractPath(match)
                const handler = this.extractHandler(match, text)

                if (method && path) {
                    routes.push({
                        path,
                        method,
                        handler,
                        middleware: this.extractMiddleware(
                            text,
                            match.index || 0
                        ),
                        parameters: this.extractRouteParameters(handler),
                        framework: this.detectFrameworkFromPattern(pattern),
                    })
                }
            }
        }

        return routes
    }

    private extractControllers(sourceFile: SourceFile): UniversalController[] {
        const controllers: UniversalController[] = []
        const classes = sourceFile.getClasses()

        for (const classDecl of classes) {
            if (this.isControllerClass(classDecl)) {
                const methods = classDecl.getMethods()
                const routes: UniversalRoute[] = []

                for (const method of methods) {
                    if (this.isRouteMethod(method)) {
                        const route = this.extractRouteFromMethod(
                            method,
                            classDecl
                        )
                        if (route) routes.push(route)
                    }
                }

                if (routes.length > 0) {
                    controllers.push({
                        name: classDecl.getName() || 'AnonymousController',
                        routes,
                        framework: this.detectFrameworkFromClass(classDecl),
                        filePath: sourceFile.getFilePath(),
                    })
                }
            }
        }

        return controllers
    }

    private extractServices(sourceFile: SourceFile): UniversalService[] {
        const services: UniversalService[] = []
        const classes = sourceFile.getClasses()

        for (const classDecl of classes) {
            if (this.isServiceClass(classDecl)) {
                const methods = classDecl.getMethods().map((method) => ({
                    name: method.getName(),
                    parameters: method.getParameters().map((param) => ({
                        name: param.getName(),
                        type: param.getTypeNode()?.getText() || 'any',
                        optional: param.hasQuestionToken(),
                    })),
                    returnType: method.getReturnTypeNode()?.getText() || 'void',
                    isPublic:
                        !method.hasModifier('private') &&
                        !method.hasModifier('protected'),
                }))

                services.push({
                    name: classDecl.getName() || 'AnonymousService',
                    methods,
                    filePath: sourceFile.getFilePath(),
                    framework: this.detectFrameworkFromClass(classDecl),
                })
            }
        }

        return services
    }

    private extractTypes(sourceFile: SourceFile): UniversalType[] {
        const types: UniversalType[] = []

        // Extract interfaces
        const interfaces = sourceFile.getInterfaces()
        for (const interfaceDecl of interfaces) {
            types.push({
                name: interfaceDecl.getName(),
                type: 'interface',
                filePath: sourceFile.getFilePath(),
                properties: interfaceDecl.getProperties().map((prop) => ({
                    name: prop.getName(),
                    type: prop.getTypeNode()?.getText() || 'any',
                    optional: prop.hasQuestionToken(),
                })),
            })
        }

        // Extract type aliases
        const typeAliases = sourceFile.getTypeAliases()
        for (const typeAlias of typeAliases) {
            types.push({
                name: typeAlias.getName(),
                type: 'type',
                filePath: sourceFile.getFilePath(),
                properties: [], // Type aliases don't have properties
            })
        }

        // Extract enums
        const enums = sourceFile.getEnums()
        for (const enumDecl of enums) {
            types.push({
                name: enumDecl.getName(),
                type: 'enum',
                filePath: sourceFile.getFilePath(),
                properties: enumDecl.getMembers().map((member) => ({
                    name: member.getName(),
                    type: 'string',
                    optional: false,
                })),
            })
        }

        return types
    }

    // Helper methods
    private extractMethod(match: RegExpExecArray): string {
        const method = match[1]?.toUpperCase()
        return method || 'GET'
    }

    private extractPath(match: RegExpExecArray): string {
        return match[2] || '/'
    }

    private extractHandler(match: RegExpExecArray, text: string): string {
        if (match[3]) return this.extractHandlerName(match[3])

        // For decorator patterns, find the method name
        const decoratorIndex = match.index || 0
        const afterDecorator = text.substring(decoratorIndex + match[0].length)
        const methodMatch = afterDecorator.match(/(\w+)\s*\(/)
        return methodMatch ? methodMatch[1] || 'anonymous' : 'anonymous'
    }

    private extractHandlerName(handlerCode: string): string {
        const arrowMatch = handlerCode.match(/(\w+)\s*=>/)
        if (arrowMatch) return arrowMatch[1] || 'anonymous'

        const functionMatch = handlerCode.match(/function\s+(\w+)/)
        if (functionMatch) return functionMatch[1] || 'anonymous'

        const asyncMatch = handlerCode.match(/async\s+(\w+)/)
        if (asyncMatch) return asyncMatch[1] || 'anonymous'

        return 'anonymous'
    }

    private extractMiddleware(_text: string, _index: number): string[] {
        // Simple middleware extraction - can be enhanced
        return []
    }

    private extractRouteParameters(_handler: string): Parameter[] {
        // Default parameters based on common patterns
        return [
            { name: 'req', type: 'Request', optional: false },
            { name: 'res', type: 'Response', optional: false },
            { name: 'next', type: 'NextFunction', optional: true },
        ]
    }

    private detectFrameworkFromPattern(
        pattern: RegExp
    ): 'express' | 'nestjs' | 'fastify' | 'koa' {
        const patternStr = pattern.toString()
        if (patternStr.includes('@(Get|Post')) return 'nestjs'
        if (patternStr.includes('fastify')) return 'fastify'
        if (patternStr.includes('router')) return 'koa'
        return 'express'
    }

    private isControllerClass(classDecl: ClassDeclaration): boolean {
        const decorators = classDecl.getDecorators()
        const name = classDecl.getName()?.toLowerCase() || ''

        return (
            decorators.some((d) => d.getName() === 'Controller') ||
            name.includes('controller') ||
            name.endsWith('controller')
        )
    }

    private isRouteMethod(method: MethodDeclaration): boolean {
        const decorators = method.getDecorators()
        return decorators.some((d) =>
            ['Get', 'Post', 'Put', 'Delete', 'Patch', 'All'].includes(
                d.getName()
            )
        )
    }

    private extractRouteFromMethod(
        method: MethodDeclaration,
        classDecl: ClassDeclaration
    ): UniversalRoute | null {
        const decorators = method.getDecorators()
        const routeDecorator = decorators.find((d) =>
            ['Get', 'Post', 'Put', 'Delete', 'Patch', 'All'].includes(
                d.getName()
            )
        )

        if (!routeDecorator) return null

        const methodName = routeDecorator.getName().toUpperCase()
        const args = routeDecorator.getArguments()
        const routePath =
            args.length > 0
                ? args[0]?.getText().replace(/['"]/g, '') || '/'
                : '/'

        // Get controller base path
        const controllerDecorator = classDecl
            .getDecorators()
            .find((d) => d.getName() === 'Controller')
        const controllerArgs = controllerDecorator?.getArguments()
        const basePath =
            controllerArgs && controllerArgs.length > 0
                ? controllerArgs[0]?.getText().replace(/['"]/g, '') || ''
                : ''

        // Combine base path with route path
        const fullPath = basePath
            ? `/${basePath}${
                  routePath === '/' ? '' : '/' + routePath.replace(/^\//, '')
              }`
            : routePath

        return {
            path: fullPath,
            method: methodName,
            handler: method.getName(),
            middleware: [],
            parameters: method.getParameters().map((param) => ({
                name: param.getName(),
                type: param.getTypeNode()?.getText() || 'any',
                optional: param.hasQuestionToken(),
                decorator: this.getParameterDecorator(param) || undefined,
            })),
            framework: 'nestjs',
        }
    }

    private getParameterDecorator(param: any): string | undefined {
        const decorators = param.getDecorators()
        return decorators.length > 0 ? decorators[0].getName() : undefined
    }

    private isServiceClass(classDecl: ClassDeclaration): boolean {
        const decorators = classDecl.getDecorators()
        const name = classDecl.getName()?.toLowerCase() || ''

        return (
            decorators.some((d) => d.getName() === 'Injectable') ||
            name.includes('service') ||
            name.endsWith('service')
        )
    }

    private detectFrameworkFromClass(
        classDecl: ClassDeclaration
    ): 'express' | 'nestjs' | 'fastify' | 'koa' {
        const decorators = classDecl.getDecorators()
        if (
            decorators.some((d) =>
                ['Controller', 'Injectable'].includes(d.getName())
            )
        ) {
            return 'nestjs'
        }
        return 'express'
    }

    private shouldSkipFile(sourceFile: SourceFile): boolean {
        const filePath = sourceFile.getFilePath()
        return (
            filePath.includes('node_modules') ||
            filePath.includes('.spec.') ||
            filePath.includes('.test.')
        )
    }
}
