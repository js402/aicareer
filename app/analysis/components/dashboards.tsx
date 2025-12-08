'use client'

import type { ExtractedCVInfo } from "@/lib/api-client"
import { ExtractedMetadataCard } from "./extracted-metadata-card"
import { AIAnalysisCard } from "./ai-analysis-card"

interface AnalysisDashboardProps {
    cvContent: string
    extractedInfo: ExtractedCVInfo | null
    isLoading: boolean
    error: string
}

export function AnalysisDashboard({ cvContent, extractedInfo, isLoading, error }: AnalysisDashboardProps) {
    return (
        <div className="space-y-6">
            {/* CV Metadata Card */}
            <ExtractedMetadataCard
                extractedInfo={extractedInfo}
                isLoading={isLoading}
                error={error}
            />

            {/* AI Analysis Section */}
            {extractedInfo && (
                <AIAnalysisCard cvContent={cvContent} />
            )}
        </div>
    )
}