import type { SupabaseClient } from '@supabase/supabase-js'
import type { ExtractedCVInfo } from './api-client'
import { openai, DEFAULT_MODEL } from '@/lib/openai'

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
        sources: string[] // CV hashes
    }>
    education: Array<{
        degree: string
        institution: string
        year: string
        confidence: number
        sources: string[] // CV hashes
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
 * Remove a CV's data from the blueprint
 */
export async function removeCVFromBlueprint(
    supabase: SupabaseClient,
    userId: string,
    cvHash: string
): Promise<void> {
    // Get current blueprint
    const { data: currentBlueprint, error: fetchError } = await supabase
        .from('cv_blueprints')
        .select('*')
        .eq('user_id', userId)
        .single()

    if (fetchError || !currentBlueprint) return // Nothing to update

    const profile: BlueprintProfile = currentBlueprint.profile_data

    // Filter out the cvHash from sources and remove items with no sources
    // Note: For personal/contact info, we don't track sources granularly yet, 
    // so we leave them as is (or we could clear them if they were the ONLY source, but that's hard to track without source fields)

    // Filter Experience
    const newExperience = profile.experience.map(item => ({
        ...item,
        sources: (item.sources || []).filter(h => h !== cvHash)
    })).filter(item => item.sources.length > 0)

    // Filter Education
    const newEducation = profile.education.map(item => ({
        ...item,
        sources: (item.sources || []).filter(h => h !== cvHash)
    })).filter(item => item.sources.length > 0)

    // Filter Skills
    const newSkills = profile.skills.map(item => ({
        ...item,
        sources: (item.sources || []).filter(h => h !== cvHash)
    })).filter(item => item.sources.length > 0)

    const newProfile = {
        ...profile,
        experience: newExperience,
        education: newEducation,
        skills: newSkills
    }

    // Recalculate metrics
    const confidenceScore = calculateConfidenceScore(newProfile, 0)
    const dataCompleteness = calculateDataCompleteness(newProfile)

    // Update DB
    await supabase
        .from('cv_blueprints')
        .update({
            profile_data: newProfile,
            total_cvs_processed: Math.max(0, (currentBlueprint.total_cvs_processed || 1) - 1),
            confidence_score: confidenceScore,
            data_completeness: dataCompleteness,
            updated_at: new Date().toISOString()
        })
        .eq('id', currentBlueprint.id)
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
    let blueprintId: string

    try {
        const { data: rpcResult, error: blueprintError } = await supabase.rpc('get_or_create_cv_blueprint', {
            p_user_id: userId
        })

        if (blueprintError) {
            if (blueprintError.message?.includes('function') &&
                blueprintError.message?.includes('does not exist') &&
                process.env.NODE_ENV !== 'test') {
                throw new Error(
                    'Database setup incomplete. Please run Supabase migrations to set up the CV blueprint system. ' +
                    'Run: supabase db push'
                )
            }
            throw new Error(`Failed to get or create blueprint: ${blueprintError.message}`)
        }

        blueprintId = rpcResult

        if (!blueprintId) {
            throw new Error('Failed to get blueprint ID from RPC call')
        }
    } catch (error) {
        if (error instanceof Error && error.message.includes('does not exist')) {
            throw error
        }
        throw new Error(`Database setup required. Please ensure Supabase migrations are applied. Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
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

    // Merge the new CV data using AI
    const { newProfile, changes, summary } = await mergeCVDataWithAI(currentProfile, cvMetadata, cvHash)

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
 * Intelligently merge CV data into existing blueprint using OpenAI
 */
async function mergeCVDataWithAI(
    existingProfile: BlueprintProfile,
    newCV: ExtractedCVInfo,
    cvHash: string
): Promise<{
    newProfile: BlueprintProfile
    changes: Array<{ type: string, description: string, impact: number }>
    summary: MergeResult['mergeSummary']
}> {

    const SYSTEM_PROMPT = `You are an expert Data Harmonizer for professional profiles.
    Your task is to merge "New CV Data" into an "Existing Blueprint Profile".
    
    CRITICAL RULES:
    1. Base Truth: The Existing Blueprint is the master record. Use it as the foundation.
    2. Deduplication: You MUST recognize semantic duplicates. 
       - "Software Engineer" at "Tech Co" (2020-2022) IS THE SAME AS "Software Developer" at "Tech Co" (2020-2022).
       - "University of Bremen" IS THE SAME AS "Universität Bremen".
       - MERGE these into a single entry, choosing the most professional/complete description.
    3. Gap Filling: If the new CV has missing dates or details that the Blueprint already has, KEEP the Blueprint's details.
    4. New Info: If the new CV has *new* roles or skills not in the Blueprint, ADD them.
    5. Contact Info: Merge contact info, keeping the union of all unique valid contacts.
    6. Skills: Merge skills lists. Deduplicate synonyms (e.g. "React" vs "React.js" -> keep "React").
    7. SOURCE TRACKING: For EVERY item in experience, education, and skills arrays, you MUST maintain a 'sources' array of strings.
       - If you create a NEW item from the New CV, 'sources' = ["${cvHash}"].
       - If you merge into an EXISTING item, append "${cvHash}" to its 'sources' if not already present.
       - If you keep an existing item untouched, KEEP its existing 'sources'.

    Output MUST be a JSON object with this structure:
    {
        "newProfile": { ...complete merged profile structure with sources... },
        "changes": [ { "type": "experience"|"education"|"skill"|"personal", "description": "Merged 'Software Dev' into existing 'Software Engineer' entry", "impact": 0.1 } ],
        "summary": { "newSkills": count, "newExperience": count, "newEducation": count, "updatedFields": count }
    }
    `

    const completion = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
                role: 'user',
                content: JSON.stringify({
                    existingProfile,
                    newCV: { ...newCV, sourceHash: cvHash }
                })
            }
        ],
        response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    // Fallback if AI fails (should rarely happen with JSON mode)
    if (!result.newProfile) {
        throw new Error("AI failed to return a valid merged profile");
    }

    return {
        newProfile: result.newProfile,
        changes: result.changes || [],
        summary: result.summary || { newSkills: 0, newExperience: 0, newEducation: 0, updatedFields: 0, confidence: 0 }
    }
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