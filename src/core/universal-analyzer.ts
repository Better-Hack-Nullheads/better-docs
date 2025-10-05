import { GenericExtractor } from '../extractors/generic/generic-extractor'
import { AnalysisResult } from '../types/universal-types'
import { FrameworkDetector } from './framework-detector'

export class UniversalAnalyzer {
    private projectPath: string

    constructor(projectPath: string) {
        this.projectPath = projectPath
    }

    async analyze(): Promise<AnalysisResult> {
        const startTime = Date.now()

        // Detect framework
        const detector = new FrameworkDetector(this.projectPath)
        const frameworkInfo = detector.detectFramework()

        console.log(
            `🔍 Detected framework: ${frameworkInfo.framework} (${frameworkInfo.confidence}% confidence)`
        )

        // Use generic extractor for all frameworks
        const genericExtractor = new GenericExtractor(this.projectPath)
        const { routes, controllers, services, types } =
            genericExtractor.extractAll()

        const analysisTime = (Date.now() - startTime) / 1000

        console.log(
            `📊 Found: ${routes.length} routes, ${controllers.length} controllers, ${services.length} services, ${types.length} types`
        )

        return {
            framework: frameworkInfo.framework,
            routes,
            controllers,
            services,
            types,
            metadata: {
                totalRoutes: routes.length,
                totalControllers: controllers.length,
                totalServices: services.length,
                analysisTime,
            },
        }
    }
}
