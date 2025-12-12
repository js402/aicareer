import type { ExtractedCVInfo, ContactInfo, ExperienceEntry, EducationEntry } from "@/lib/api-client"

export interface FieldValidation {
    field: string
    label: string
    section: string
    isRequired: boolean
    isMissing: boolean
    severity: 'error' | 'warning' | 'info'
    message: string
}

export interface SectionValidation {
    id: string
    label: string
    isComplete: boolean
    completionPercentage: number
    missingFields: FieldValidation[]
    warningFields: FieldValidation[]
}

export interface CVValidationResult {
    isComplete: boolean
    overallScore: number
    sections: SectionValidation[]
    criticalMissing: FieldValidation[]
    recommendations: string[]
}

// Required fields for a complete CV (commented for reference)
// Personal: name, email
// Experience: at least one entry with title/company
// Education: at least one entry
// Skills: at least some skills

function validateContactInfo(contactInfo: string | ContactInfo | undefined): FieldValidation[] {
    const validations: FieldValidation[] = []
    
    if (!contactInfo) {
        validations.push({
            field: 'contactInfo',
            label: 'Contact Information',
            section: 'personal',
            isRequired: true,
            isMissing: true,
            severity: 'error',
            message: 'Contact information is required'
        })
        return validations
    }

    const contact: ContactInfo = typeof contactInfo === 'string' 
        ? { raw: contactInfo }
        : contactInfo

    if (!contact.email && !contact.raw?.includes('@')) {
        validations.push({
            field: 'contactInfo.email',
            label: 'Email Address',
            section: 'personal',
            isRequired: true,
            isMissing: true,
            severity: 'error',
            message: 'Email address is required for job applications'
        })
    }

    if (!contact.phone) {
        validations.push({
            field: 'contactInfo.phone',
            label: 'Phone Number',
            section: 'personal',
            isRequired: false,
            isMissing: true,
            severity: 'warning',
            message: 'Adding a phone number helps recruiters contact you'
        })
    }

    if (!contact.location) {
        validations.push({
            field: 'contactInfo.location',
            label: 'Location',
            section: 'personal',
            isRequired: false,
            isMissing: true,
            severity: 'info',
            message: 'Location helps match you with relevant opportunities'
        })
    }

    if (!contact.linkedin) {
        validations.push({
            field: 'contactInfo.linkedin',
            label: 'LinkedIn Profile',
            section: 'personal',
            isRequired: false,
            isMissing: true,
            severity: 'info',
            message: 'LinkedIn profile strengthens your professional presence'
        })
    }

    return validations
}

function validateExperience(experience: ExperienceEntry[] | undefined): FieldValidation[] {
    const validations: FieldValidation[] = []

    if (!experience || experience.length === 0) {
        validations.push({
            field: 'experience',
            label: 'Work Experience',
            section: 'experience',
            isRequired: true,
            isMissing: true,
            severity: 'error',
            message: 'At least one work experience entry is required'
        })
        return validations
    }

    // Check quality of experience entries
    const entriesWithoutHighlights = experience.filter(e => !e.highlights || e.highlights.length === 0)
    if (entriesWithoutHighlights.length > 0) {
        validations.push({
            field: 'experience.highlights',
            label: 'Experience Highlights',
            section: 'experience',
            isRequired: false,
            isMissing: true,
            severity: 'warning',
            message: `${entriesWithoutHighlights.length} experience ${entriesWithoutHighlights.length === 1 ? 'entry lacks' : 'entries lack'} key achievements/highlights`
        })
    }

    const entriesWithoutDuration = experience.filter(e => !e.duration)
    if (entriesWithoutDuration.length > 0) {
        validations.push({
            field: 'experience.duration',
            label: 'Experience Duration',
            section: 'experience',
            isRequired: false,
            isMissing: true,
            severity: 'warning',
            message: 'Some experience entries are missing duration information'
        })
    }

    return validations
}

function validateEducation(education: EducationEntry[] | undefined): FieldValidation[] {
    const validations: FieldValidation[] = []

    if (!education || education.length === 0) {
        validations.push({
            field: 'education',
            label: 'Education',
            section: 'education',
            isRequired: true,
            isMissing: true,
            severity: 'warning', // Some roles don't require formal education
            message: 'Education information helps match you with relevant positions'
        })
        return validations
    }

    return validations
}

function validateSkills(skills: string[] | undefined): FieldValidation[] {
    const validations: FieldValidation[] = []

    if (!skills || skills.length === 0) {
        validations.push({
            field: 'skills',
            label: 'Skills',
            section: 'skills',
            isRequired: true,
            isMissing: true,
            severity: 'error',
            message: 'Skills are essential for job matching'
        })
        return validations
    }

    if (skills.length < 5) {
        validations.push({
            field: 'skills',
            label: 'Skills',
            section: 'skills',
            isRequired: false,
            isMissing: false,
            severity: 'info',
            message: 'Adding more skills improves job matching accuracy'
        })
    }

    return validations
}

export function validateCV(data: ExtractedCVInfo): CVValidationResult {
    const allValidations: FieldValidation[] = []

    // Personal Info Validation
    if (!data.name) {
        allValidations.push({
            field: 'name',
            label: 'Full Name',
            section: 'personal',
            isRequired: true,
            isMissing: true,
            severity: 'error',
            message: 'Your name is required'
        })
    }

    allValidations.push(...validateContactInfo(data.contactInfo))

    if (!data.seniorityLevel) {
        allValidations.push({
            field: 'seniorityLevel',
            label: 'Seniority Level',
            section: 'personal',
            isRequired: false,
            isMissing: true,
            severity: 'info',
            message: 'Seniority level helps match you with appropriate positions'
        })
    }

    // Summary Validation
    if (!data.summary) {
        allValidations.push({
            field: 'summary',
            label: 'Professional Summary',
            section: 'personal',
            isRequired: false,
            isMissing: true,
            severity: 'warning',
            message: 'A professional summary helps recruiters understand your profile'
        })
    }

    // Experience Validation
    allValidations.push(...validateExperience(data.experience))

    // Education Validation
    allValidations.push(...validateEducation(data.education))

    // Skills Validation
    allValidations.push(...validateSkills(data.skills))

    // Projects (optional)
    if (!data.projects || data.projects.length === 0) {
        allValidations.push({
            field: 'projects',
            label: 'Projects',
            section: 'projects',
            isRequired: false,
            isMissing: true,
            severity: 'info',
            message: 'Projects showcase your practical experience'
        })
    }

    // Certifications (optional)
    if (!data.certifications || data.certifications.length === 0) {
        allValidations.push({
            field: 'certifications',
            label: 'Certifications',
            section: 'certifications',
            isRequired: false,
            isMissing: true,
            severity: 'info',
            message: 'Certifications validate your expertise'
        })
    }

    // Languages (optional)
    if (!data.languages || data.languages.length === 0) {
        allValidations.push({
            field: 'languages',
            label: 'Languages',
            section: 'languages',
            isRequired: false,
            isMissing: true,
            severity: 'info',
            message: 'Language skills can be valuable for international roles'
        })
    }

    // Calculate section validations
    const sections: SectionValidation[] = [
        calculateSectionValidation('personal', 'Personal Info', allValidations, ['name', 'contactInfo', 'summary', 'seniorityLevel']),
        calculateSectionValidation('experience', 'Experience', allValidations, ['experience']),
        calculateSectionValidation('education', 'Education', allValidations, ['education']),
        calculateSectionValidation('skills', 'Skills', allValidations, ['skills']),
        calculateSectionValidation('projects', 'Projects', allValidations, ['projects']),
        calculateSectionValidation('certifications', 'Certifications', allValidations, ['certifications']),
        calculateSectionValidation('languages', 'Languages', allValidations, ['languages']),
    ]

    // Get critical missing fields (required fields that are missing)
    const criticalMissing = allValidations.filter(v => v.isRequired && v.isMissing)

    // Generate recommendations
    const recommendations = generateRecommendations(allValidations)

    // Calculate overall score
    const requiredFieldsTotal = allValidations.filter(v => v.isRequired).length
    const requiredFieldsMissing = criticalMissing.length
    const overallScore = requiredFieldsTotal > 0 
        ? Math.round(((requiredFieldsTotal - requiredFieldsMissing) / requiredFieldsTotal) * 100)
        : 100

    return {
        isComplete: criticalMissing.length === 0,
        overallScore,
        sections,
        criticalMissing,
        recommendations
    }
}

function calculateSectionValidation(
    id: string,
    label: string,
    allValidations: FieldValidation[],
    fields: string[]
): SectionValidation {
    const sectionValidations = allValidations.filter(v => v.section === id)
    const missingFields = sectionValidations.filter(v => v.isMissing && (v.severity === 'error' || v.severity === 'warning'))
    const warningFields = sectionValidations.filter(v => v.severity === 'info')
    
    const totalFields = fields.length + warningFields.length
    const completedFields = totalFields - missingFields.length
    const completionPercentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 100

    return {
        id,
        label,
        isComplete: missingFields.filter(f => f.isRequired).length === 0,
        completionPercentage: Math.min(100, Math.max(0, completionPercentage)),
        missingFields,
        warningFields
    }
}

function generateRecommendations(validations: FieldValidation[]): string[] {
    const recommendations: string[] = []
    
    const errors = validations.filter(v => v.severity === 'error' && v.isMissing)
    const warnings = validations.filter(v => v.severity === 'warning' && v.isMissing)
    
    if (errors.length > 0) {
        recommendations.push(`Complete ${errors.length} required field${errors.length > 1 ? 's' : ''} to enable full analysis`)
    }
    
    if (warnings.length > 0) {
        recommendations.push(`Add ${warnings.length} recommended field${warnings.length > 1 ? 's' : ''} to improve job matching`)
    }
    
    const hasNoHighlights = validations.some(v => v.field === 'experience.highlights' && v.isMissing)
    if (hasNoHighlights) {
        recommendations.push('Add achievements and highlights to your experience entries')
    }
    
    return recommendations
}

export function getMissingFieldsForSection(
    validation: CVValidationResult,
    sectionId: string
): FieldValidation[] {
    const section = validation.sections.find(s => s.id === sectionId)
    return section ? [...section.missingFields, ...section.warningFields] : []
}

export function getFirstIncompleteSectionId(validation: CVValidationResult): string | null {
    const incompleteSection = validation.sections.find(s => !s.isComplete)
    return incompleteSection?.id || null
}
