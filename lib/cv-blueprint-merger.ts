import type { SupabaseClient } from '@supabase/supabase-js'
import type { ExtractedCVInfo } from './api-client'

interface BlueprintProfile {
    personal: {
        name?: string
        summary?: string
    }
    contact: {
        email?: string
        phone?: string
        location?: string
        linkedin?: string
        website?: string
    }
    experience: Array<{
        role: string
        company: string
        duration: string
        description?: string
        confidence: number
    }>
    education: Array<{
        degree: string
        institution: string
        year: string
        confidence: number
    }>
    skills: Array<{
        name: string
        confidence: number
        sources: string[] // CV hashes where this skill was found
    }>
}

interface MergeResult {
    blueprint: any
    changes: Array<{
        type: string
        description: string
        impact: number
    }>
    mergeSummary: {
        newSkills: number
        newExperience: number
        newEducation: number
        updatedFields: number
        confidence: number
    }
}

/**
 * Merge new CV data into the user's blueprint
 */
export async function mergeCVIntoBlueprint(
    supabase: SupabaseClient,
    userId: string,
    cvMetadata: ExtractedCVInfo,
    cvHash: string
): Promise<MergeResult> {
    // Get or create blueprint
    const { data: blueprintId, error: blueprintError } = await supabase.rpc('get_or_create_cv_blueprint', {
        p_user_id: userId
    })

    if (blueprintError) {
        throw new Error(`Failed to get or create blueprint: ${blueprintError.message}`)
    }

    if (!blueprintId) {
        throw new Error('Failed to get blueprint ID from RPC call')
    }

    // Get current blueprint
    const { data: currentBlueprint, error: fetchError } = await supabase
        .from('cv_blueprints')
        .select('*')
        .eq('id', blueprintId)
        .single()

    if (fetchError) {
        throw new Error(`Failed to fetch blueprint: ${fetchError.message}`)
    }

    const currentProfile: BlueprintProfile = currentBlueprint?.profile_data || {
        personal: {},
        contact: {},
        experience: [],
        education: [],
        skills: []
    }

    // Merge the new CV data
    const { newProfile, changes, summary } = mergeCVData(currentProfile, cvMetadata, cvHash)

    // Calculate new completeness and confidence
    const dataCompleteness = calculateDataCompleteness(newProfile)
    const confidenceScore = calculateConfidenceScore(newProfile, summary.newSkills + summary.newExperience + summary.newEducation)

    // Update the blueprint
    const { data: updatedBlueprint } = await supabase
        .from('cv_blueprints')
        .update({
            profile_data: newProfile,
            total_cvs_processed: (currentBlueprint?.total_cvs_processed || 0) + 1,
            last_cv_processed_at: new Date().toISOString(),
            blueprint_version: (currentBlueprint?.blueprint_version || 1) + 1,
            confidence_score: confidenceScore,
            data_completeness: dataCompleteness,
            updated_at: new Date().toISOString()
        })
        .eq('id', blueprintId)
        .select()
        .single()

    // Record the changes
    if (changes.length > 0) {
        await supabase.rpc('record_blueprint_change', {
            p_blueprint_id: blueprintId,
            p_user_id: userId,
            p_change_type: 'cv_processed',
            p_cv_hash: cvHash,
            p_previous_data: currentProfile,
            p_new_data: newProfile,
            p_changes_summary: `Processed CV: ${changes.map(c => c.description).join(', ')}`,
            p_confidence_impact: summary.newSkills * 0.1 + summary.newExperience * 0.2 + summary.newEducation * 0.15
        })
    }

    return {
        blueprint: updatedBlueprint,
        changes,
        mergeSummary: summary
    }
}

/**
 * Intelligently merge CV data into existing blueprint
 */
function mergeCVData(existingProfile: BlueprintProfile, newCV: ExtractedCVInfo, cvHash: string): {
    newProfile: BlueprintProfile
    changes: Array<{type: string, description: string, impact: number}>
    summary: MergeResult['mergeSummary']
} {
    const newProfile: BlueprintProfile = JSON.parse(JSON.stringify(existingProfile))
    const changes: Array<{type: string, description: string, impact: number}> = []
    const summary = {
        newSkills: 0,
        newExperience: 0,
        newEducation: 0,
        updatedFields: 0,
        confidence: 0
    }

    // Merge personal information
    if (newCV.name && (!existingProfile.personal.name || existingProfile.personal.name.length < newCV.name.length)) {
        newProfile.personal.name = newCV.name
        changes.push({
            type: 'personal',
            description: `Updated name to "${newCV.name}"`,
            impact: 0.1
        })
        summary.updatedFields++
    }

    // Merge contact information
    const contactFields = ['email', 'phone', 'location', 'linkedin', 'website'] as const
    for (const field of contactFields) {
        const newValue = (newCV.contactInfo as any)?.[field]
        if (newValue && !existingProfile.contact[field]) {
            ;(newProfile.contact as any)[field] = newValue
            changes.push({
                type: 'contact',
                description: `Added ${field}: ${newValue}`,
                impact: 0.05
            })
            summary.updatedFields++
        }
    }

    // Merge skills with deduplication and confidence tracking
    for (const skill of newCV.skills) {
        const existingSkillIndex = newProfile.skills.findIndex(s =>
            s.name.toLowerCase() === skill.toLowerCase()
        )

        if (existingSkillIndex === -1) {
            // New skill
            newProfile.skills.push({
                name: skill,
                confidence: 0.8, // High confidence for new skills
                sources: cvHash ? [cvHash] : []
            })
            changes.push({
                type: 'skill',
                description: `Added new skill: ${skill}`,
                impact: 0.1
            })
            summary.newSkills++
        } else {
            // Existing skill - increase confidence and add source
            const existingSkill = newProfile.skills[existingSkillIndex]
            existingSkill.confidence = Math.min(1.0, existingSkill.confidence + 0.1)
            if (cvHash && !existingSkill.sources.includes(cvHash)) {
                existingSkill.sources.push(cvHash)
            }
        }
    }

    // Merge experience with intelligent deduplication
    for (const newExp of newCV.experience) {
        const isDuplicate = newProfile.experience.some(existingExp =>
            existingExp.role.toLowerCase() === newExp.role.toLowerCase() &&
            existingExp.company.toLowerCase() === newExp.company.toLowerCase() &&
            Math.abs(parseDuration(existingExp.duration) - parseDuration(newExp.duration)) < 0.5 // Within 6 months
        )

        if (!isDuplicate) {
            newProfile.experience.push({
                ...newExp,
                confidence: 0.9 // High confidence for new experience
            })
            changes.push({
                type: 'experience',
                description: `Added experience: ${newExp.role} at ${newExp.company}`,
                impact: 0.2
            })
            summary.newExperience++
        }
    }

    // Sort experience by recency (rough approximation)
    newProfile.experience.sort((a, b) => parseDuration(b.duration) - parseDuration(a.duration))

    // Merge education with deduplication
    for (const newEdu of newCV.education) {
        const isDuplicate = newProfile.education.some(existingEdu =>
            existingEdu.degree.toLowerCase() === newEdu.degree.toLowerCase() &&
            existingEdu.institution.toLowerCase() === newEdu.institution.toLowerCase()
        )

        if (!isDuplicate) {
            newProfile.education.push({
                ...newEdu,
                confidence: 0.9 // High confidence for new education
            })
            changes.push({
                type: 'education',
                description: `Added education: ${newEdu.degree} from ${newEdu.institution}`,
                impact: 0.15
            })
            summary.newEducation++
        }
    }

    // Sort education by recency
    newProfile.education.sort((a, b) => parseInt(b.year) - parseInt(a.year))

    // Calculate overall confidence
    summary.confidence = calculateConfidenceScore(newProfile, summary.newSkills + summary.newExperience + summary.newEducation)

    return { newProfile, changes, summary }
}

/**
 * Parse duration string to approximate years
 */
function parseDuration(duration: string): number {
    // Simple parsing - could be enhanced
    const years = duration.match(/(\d+)\s*(?:year|yr)/i)
    const months = duration.match(/(\d+)\s*(?:month|mo)/i)

    let totalYears = 0
    if (years) totalYears += parseInt(years[1])
    if (months) totalYears += parseInt(months[1]) / 12

    return totalYears
}

/**
 * Calculate data completeness score
 */
function calculateDataCompleteness(profile: BlueprintProfile): number {
    let score = 0
    let total = 0

    // Personal info (20%)
    total += 0.2
    if (profile.personal.name) score += 0.2

    // Contact info (20%)
    total += 0.2
    const contactFields = Object.values(profile.contact).filter(Boolean).length
    score += (contactFields / 5) * 0.2

    // Skills (20%)
    total += 0.2
    if (profile.skills.length > 0) score += 0.2

    // Experience (30%)
    total += 0.3
    if (profile.experience.length > 0) score += 0.3

    // Education (10%)
    total += 0.1
    if (profile.education.length > 0) score += 0.1

    return score / total
}

/**
 * Calculate confidence score based on data quality and quantity
 */
function calculateConfidenceScore(profile: BlueprintProfile, newItems: number): number {
    const baseConfidence = calculateDataCompleteness(profile)
    const learningBonus = Math.min(0.2, newItems * 0.02) // Bonus for recent learning
    const experienceBonus = Math.min(0.1, profile.experience.length * 0.02) // Bonus for extensive experience

    return Math.min(1.0, baseConfidence + learningBonus + experienceBonus)
}