import { z } from 'zod'

// Common validation schemas
export const emailSchema = z.string().email('Invalid email format')

export const urlSchema = z.string().url('Invalid URL format')

export const nonEmptyString = z.string().min(1, 'Field cannot be empty')

// CV Analysis schemas
export const analyzeCVSchema = z.object({
  cvContent: z.string().min(10, 'CV content must be at least 10 characters').max(50000, 'CV content is too large').optional(),
  extractedInfo: z.object({
    name: z.string().optional(),
    contactInfo: z.any().optional(),
    summary: z.string().optional(),
    experience: z.array(z.any()).optional(),
    skills: z.array(z.string()).optional(),
    inferredSkills: z.array(z.string()).optional(),
    education: z.array(z.any()).optional(),
    certifications: z.array(z.any()).optional(),
    projects: z.array(z.any()).optional(),
    languages: z.array(z.any()).optional(),
    leadership: z.array(z.any()).optional(),
    seniorityLevel: z.string().optional(),
    yearsOfExperience: z.number().optional(),
  }).optional(),
}).refine(
  (data) => data.cvContent || data.extractedInfo,
  { message: 'Either cvContent or extractedInfo must be provided' }
)

export const extractCVMetadataSchema = z.object({
  cvContent: z.string().min(10, 'CV content must be at least 10 characters').max(50000, 'CV content is too large')
})

// Job position schemas
// Helper to normalize employment type from LLM output
const normalizeEmploymentType = z.string().nullable().optional().transform((val) => {
  if (!val || val.trim() === '') return null
  const normalized = val.toLowerCase().trim()
  const mapping: Record<string, string> = {
    'full-time': 'full-time',
    'fulltime': 'full-time',
    'full time': 'full-time',
    'part-time': 'part-time',
    'parttime': 'part-time',
    'part time': 'part-time',
    'contract': 'contract',
    'contractor': 'contract',
    'freelance': 'freelance',
    'freelancer': 'freelance',
    'internship': 'internship',
    'intern': 'internship',
  }
  return mapping[normalized] || null
})

// Helper to normalize seniority level from LLM output
const normalizeSeniorityLevel = z.string().nullable().optional().transform((val) => {
  if (!val || val.trim() === '') return null
  const normalized = val.toLowerCase().trim()
  const mapping: Record<string, string> = {
    'entry': 'entry',
    'entry-level': 'entry',
    'entry level': 'entry',
    'junior': 'junior',
    'jr': 'junior',
    'mid': 'mid',
    'mid-level': 'mid',
    'mid level': 'mid',
    'middle': 'mid',
    'senior': 'senior',
    'sr': 'senior',
    'lead': 'lead',
    'team lead': 'lead',
    'tech lead': 'lead',
    'principal': 'principal',
    'staff': 'principal',
    'executive': 'executive',
    'director': 'executive',
    'vp': 'executive',
    'c-level': 'executive',
    'cto': 'executive',
    'ceo': 'executive',
  }
  return mapping[normalized] || null
})

export const createJobPositionSchema = z.object({
  company_name: nonEmptyString.max(100, 'Company name is too long'),
  position_title: nonEmptyString.max(100, 'Position title is too long'),
  job_description: nonEmptyString.max(10000, 'Job description is too long'),
  job_url: urlSchema.optional(),
  location: z.string().max(100, 'Location is too long').optional(),
  salary_range: z.string().max(50, 'Salary range is too long').optional(),
  match_score: z.number().min(0).max(100).optional(),
  matching_skills: z.array(z.string()).optional(),
  missing_skills: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
  experience_alignment: z.any().optional(),
  responsibility_alignment: z.any().optional(),
  employment_type: normalizeEmploymentType,
  seniority_level: normalizeSeniorityLevel,
  cv_metadata_id: z.string().uuid('Valid CV metadata ID is required')
})

export const updateJobPositionSchema = z.object({
  status: z.enum(['saved', 'applied', 'interviewing', 'offered', 'rejected', 'withdrawn']).optional(),
  notes: z.string().max(1000, 'Notes are too long').optional(),
  submitted_cv_id: z.string().uuid('Invalid CV ID').optional(),
  // Fields for re-analyzing with a different CV
  cv_metadata_id: z.string().uuid('Invalid CV metadata ID').optional(),
  match_score: z.number().min(0).max(100).optional(),
  matching_skills: z.array(z.string()).optional(),
  missing_skills: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
  experience_alignment: z.any().optional(),
  responsibility_alignment: z.any().optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be provided for update'
)

// Career guidance schemas
export const careerGuidanceSchema = z.object({
  cvContent: z.string().min(10, 'CV content must be at least 10 characters').max(50000, 'CV content is too large')
})

// CV tailoring schemas
export const tailorCVSchema = z.object({
  jobDescription: nonEmptyString.max(10000, 'Job description is too long'),
  matchAnalysis: z.any().optional(), // Analysis from job match evaluation
  additionalInstructions: z.string().max(1000, 'Instructions are too long').optional(),
  cvMetadataId: z.string().uuid('Valid CV metadata ID is required') // Required: specify which CV to tailor
})

// Job match evaluation schemas
export const evaluateJobMatchSchema = z.object({
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters').max(10000, 'Job description is too long'),
  cvMetadataId: z.string().uuid().optional() // Optional: specify which CV to evaluate
})

// CV metadata schemas
export const updateCVMetadataSchema = z.object({
  filename: z.string().max(255, 'Filename is too long').optional(),
  tags: z.array(z.string().max(50, 'Tag is too long')).optional(),
  notes: z.string().max(1000, 'Notes are too long').optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  'At least one field must be provided for update'
)

// Contact info parsing schemas
export const parseContactInfoSchema = z.object({
  text: z.string().min(1, 'Text cannot be empty').max(10000, 'Text is too long')
})

// Stripe webhook schemas
export const stripeWebhookSchema = z.object({
  id: z.string(),
  object: z.string(),
  api_version: z.string().optional(),
  created: z.number(),
  data: z.object({
    object: z.any()
  }),
  livemode: z.boolean(),
  pending_webhooks: z.number(),
  request: z.any().optional(),
  type: z.string()
})

// Utility function for safe validation
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      try {
        const errorMessage = error.issues
          .map(err => {
            const path = err.path?.length > 0 ? err.path.join('.') : 'root'
            return `${path}: ${err.message}`
          })
          .join(', ')
        return { success: false, error: errorMessage }
      } catch {
        // Fallback error handling
        return { success: false, error: error.message || 'Validation failed' }
      }
    }
    return { success: false, error: error instanceof Error ? error.message : 'Invalid input format' }
  }
}

// Type exports
export type AnalyzeCVInput = z.infer<typeof analyzeCVSchema>
export type ExtractCVMetadataInput = z.infer<typeof extractCVMetadataSchema>
export type CreateJobPositionInput = z.infer<typeof createJobPositionSchema>
export type UpdateJobPositionInput = z.infer<typeof updateJobPositionSchema>
export type CareerGuidanceInput = z.infer<typeof careerGuidanceSchema>
export type TailorCVInput = z.infer<typeof tailorCVSchema>
export type EvaluateJobMatchInput = z.infer<typeof evaluateJobMatchSchema>
export type UpdateCVMetadataInput = z.infer<typeof updateCVMetadataSchema>
export type ParseContactInfoInput = z.infer<typeof parseContactInfoSchema>
export type StripeWebhookInput = z.infer<typeof stripeWebhookSchema>
