import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

export type Framework = 'express' | 'nestjs' | 'fastify' | 'koa' | 'unknown'

export interface FrameworkInfo {
    framework: Framework
    confidence: number
    indicators: string[]
}

export class FrameworkDetector {
    private projectPath: string

    constructor(projectPath: string) {
        this.projectPath = projectPath
    }

    detectFramework(): FrameworkInfo {
        const packageJson = this.readPackageJson()
        const indicators: string[] = []
        let confidence = 0

        // Check dependencies
        if (packageJson.dependencies) {
            if (packageJson.dependencies.express) {
                indicators.push('express dependency')
                confidence += 40
            }
            if (packageJson.dependencies['@nestjs/core']) {
                indicators.push('nestjs dependency')
                confidence += 40
            }
            if (packageJson.dependencies.fastify) {
                indicators.push('fastify dependency')
                confidence += 40
            }
            if (packageJson.dependencies.koa) {
                indicators.push('koa dependency')
                confidence += 40
            }
        }

        // Check file patterns
        if (this.hasExpressPatterns()) {
            indicators.push('express patterns')
            confidence += 20
        }
        if (this.hasNestJSPatterns()) {
            indicators.push('nestjs patterns')
            confidence += 20
        }

        const framework = this.determineFramework(confidence, indicators)

        return {
            framework,
            confidence: Math.min(confidence, 100),
            indicators,
        }
    }

    private readPackageJson(): any {
        const packagePath = join(this.projectPath, 'package.json')
        if (!existsSync(packagePath)) {
            return {}
        }
        return JSON.parse(readFileSync(packagePath, 'utf-8'))
    }

    private hasExpressPatterns(): boolean {
        // Simple check for Express patterns
        return (
            this.hasFilePattern(['app.js', 'server.js', 'index.js']) ||
            this.hasImportPattern('express')
        )
    }

    private hasNestJSPatterns(): boolean {
        // Simple check for NestJS patterns
        return (
            this.hasFilePattern(['main.ts', 'app.module.ts']) ||
            this.hasImportPattern('@nestjs')
        )
    }

    private hasFilePattern(patterns: string[]): boolean {
        return patterns.some(
            (pattern) =>
                existsSync(join(this.projectPath, 'src', pattern)) ||
                existsSync(join(this.projectPath, pattern))
        )
    }

    private hasImportPattern(_pattern: string): boolean {
        // This would scan TypeScript files for imports
        // For now, return false - can be enhanced later
        return false
    }

    private determineFramework(
        _confidence: number,
        indicators: string[]
    ): Framework {
        if (
            indicators.includes('nestjs dependency') ||
            indicators.includes('nestjs patterns')
        ) {
            return 'nestjs'
        }
        if (
            indicators.includes('express dependency') ||
            indicators.includes('express patterns')
        ) {
            return 'express'
        }
        if (indicators.includes('fastify dependency')) {
            return 'fastify'
        }
        if (indicators.includes('koa dependency')) {
            return 'koa'
        }
        return 'unknown'
    }
}
