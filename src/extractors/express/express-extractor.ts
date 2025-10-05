import { Project, SourceFile } from 'ts-morph'
import {
    Parameter,
    UniversalController,
    UniversalRoute,
} from '../../types/universal-types'

export class ExpressExtractor {
    private project: Project

    constructor(projectPath: string) {
        this.project = new Project({
            tsConfigFilePath: `${projectPath}/tsconfig.json`,
        })
    }

    extractRoutes(): UniversalRoute[] {
        const routes: UniversalRoute[] = []
        const sourceFiles = this.project.getSourceFiles()

        for (const sourceFile of sourceFiles) {
            if (this.shouldSkipFile(sourceFile)) continue

            const expressRoutes = this.extractExpressRoutes(sourceFile)
            routes.push(...expressRoutes)
        }

        return routes
    }

    extractControllers(): UniversalController[] {
        const routes = this.extractRoutes()
        const controllers = this.groupRoutesByFile(routes)
        return controllers
    }

    private extractExpressRoutes(sourceFile: SourceFile): UniversalRoute[] {
        const routes: UniversalRoute[] = []
        const text = sourceFile.getFullText()

        // Simple regex patterns for Express routes
        const routePatterns = [
            /app\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`],\s*([^,)]+)/g,
            /router\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`],\s*([^,)]+)/g,
        ]

        for (const pattern of routePatterns) {
            let match
            while ((match = pattern.exec(text)) !== null) {
                const method = match[1]?.toUpperCase() || 'GET'
                const path = match[2] || '/'
                const handler = this.extractHandlerName(match[3] || 'anonymous')

                routes.push({
                    path,
                    method,
                    handler,
                    middleware: [],
                    parameters: this.extractParameters(),
                    framework: 'express',
                })
            }
        }

        return routes
    }

    private extractHandlerName(handlerCode: string): string {
        // Extract function name from handler code
        const arrowMatch = handlerCode.match(/(\w+)\s*=>/)
        if (arrowMatch) return arrowMatch[1] || 'anonymous'

        const functionMatch = handlerCode.match(/function\s+(\w+)/)
        if (functionMatch) return functionMatch[1] || 'anonymous'

        const asyncMatch = handlerCode.match(/async\s+(\w+)/)
        if (asyncMatch) return asyncMatch[1] || 'anonymous'

        return 'anonymous'
    }

    private extractParameters(): Parameter[] {
        // Default Express parameters
        return [
            { name: 'req', type: 'Request', optional: false },
            { name: 'res', type: 'Response', optional: false },
            { name: 'next', type: 'NextFunction', optional: true },
        ]
    }

    private groupRoutesByFile(routes: UniversalRoute[]): UniversalController[] {
        const fileGroups = new Map<string, UniversalRoute[]>()

        for (const route of routes) {
            const filePath = route.path.split('/')[0] || 'root'
            if (!fileGroups.has(filePath)) {
                fileGroups.set(filePath, [])
            }
            fileGroups.get(filePath)!.push(route)
        }

        const controllers: UniversalController[] = []
        for (const [filePath, fileRoutes] of fileGroups) {
            controllers.push({
                name: this.getControllerName(filePath),
                routes: fileRoutes,
                framework: 'express',
                filePath,
            })
        }

        return controllers
    }

    private getControllerName(filePath: string): string {
        return (
            filePath
                .split('/')
                .pop()
                ?.replace(/\.(ts|js)$/, '') || 'UnknownController'
        )
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
