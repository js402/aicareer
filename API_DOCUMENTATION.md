# TechCareer.AI API Documentation

## Overview

TechCareer.AI provides a comprehensive REST API for CV analysis, job matching, and career management. All endpoints require authentication except where noted.

## Authentication

All API endpoints require authentication via Supabase JWT tokens. Include the authorization header:

```
Authorization: Bearer <supabase-jwt-token>
```

## Base URL

```
https://your-domain.com/api
```

---

## CV Analysis Endpoints

### POST `/analyze-cv`

Analyzes a complete CV and provides comprehensive career insights using GPT-4.

**Request Body:**
```json
{
  "cvContent": "Full CV text content in plain text or markdown format"
}
```

**Response (200):**
```json
{
  "analysis": "# Executive Summary\n\nDetailed markdown analysis...",
  "extractedInfo": {
    "name": "John Doe",
    "contactInfo": "john@example.com | (555) 123-4567",
    "experience": [
      {
        "role": "Senior Software Engineer",
        "company": "Tech Corp",
        "duration": "2020 - Present"
      }
    ],
    "skills": ["JavaScript", "React", "Node.js", "Python"],
    "education": [
      {
        "degree": "Bachelor of Science",
        "institution": "University of Technology",
        "year": "2018"
      }
    ]
  },
  "fromCache": false
}
```

**Error Responses:**
- `400`: Missing or invalid CV content
- `500`: Analysis failed

### POST `/extract-cv-metadata`

Extracts structured metadata from CV content without performing full analysis.

**Request Body:**
```json
{
  "cvContent": "Full CV text content"
}
```

**Response (200):**
```json
{
  "extractedInfo": {
    "name": "John Doe",
    "contactInfo": {
      "email": "john@example.com",
      "phone": "+15551234567",
      "location": "San Francisco, CA",
      "linkedin": "https://linkedin.com/in/johndoe"
    },
    "experience": [...],
    "skills": [...],
    "education": [...]
  },
  "status": "valid"
}
```

---

## CV Blueprint System

### GET `/cv-blueprint`

Retrieves the user's accumulated CV blueprint profile.

**Response (200):**
```json
{
  "blueprint": {
    "id": "blueprint-123",
    "user_id": "user-456",
    "profile_data": {
      "personal": {
        "name": "John Doe",
        "summary": "Experienced software engineer..."
      },
      "contact": {
        "email": "john@example.com",
        "phone": "+15551234567"
      },
      "experience": [...],
      "education": [...],
      "skills": [...]
    },
    "total_cvs_processed": 3,
    "confidence_score": 0.85,
    "data_completeness": 0.90,
    "blueprint_version": 5
  },
  "isNew": false
}
```

### POST `/cv-blueprint`

Processes new CV data into the learning blueprint system.

**Request Body:**
```json
{
  "cvMetadata": {
    "name": "John Doe",
    "contactInfo": {...},
    "experience": [...],
    "skills": [...],
    "education": [...]
  },
  "cvHash": "sha256-hash-of-cv-content"
}
```

**Response (200):**
```json
{
  "success": true,
  "blueprint": { /* updated blueprint */ },
  "changes": [
    {
      "type": "skill",
      "description": "Added new skill: TypeScript",
      "impact": 0.1
    }
  ],
  "mergeSummary": {
    "newSkills": 2,
    "newExperience": 1,
    "newEducation": 0,
    "updatedFields": 1,
    "confidence": 0.87
  }
}
```

---

## Job Matching

### POST `/evaluate-job-match`

Analyzes compatibility between user's CV blueprint and a job description.

**Request Body:**
```json
{
  "jobDescription": "Full job posting text including requirements, responsibilities, etc."
}
```

**Response (200):**
```json
{
  "matchScore": 85,
  "matchingSkills": ["React", "Node.js", "TypeScript"],
  "missingSkills": ["Vue.js", "Docker"],
  "experienceAlignment": {
    "seniorityMatch": "Good Fit",
    "yearsExperienceRequired": 3,
    "yearsExperienceCandidate": 4,
    "comment": "Candidate exceeds experience requirements"
  },
  "responsibilityAlignment": {
    "matchingResponsibilities": [
      "Develop web applications",
      "Collaborate with cross-functional teams"
    ],
    "missingResponsibilities": [
      "Manage junior developers"
    ]
  },
  "recommendations": [
    "Consider learning Vue.js for broader React ecosystem coverage",
    "Gain experience in Docker containerization"
  ],
  "metadata": {
    "company_name": "Tech Corp",
    "position_title": "Senior Frontend Developer",
    "location": "San Francisco, CA",
    "salary_range": "$120k - $160k",
    "employment_type": "Full-time",
    "seniority_level": "Senior"
  },
  "fromCache": false,
  "cachedAt": null
}
```

---

## CV Metadata Management

### GET `/cv-metadata`

Retrieves all CV metadata entries for the authenticated user.

**Query Parameters:**
- `limit` (optional): Number of results to return (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response (200):**
```json
{
  "metadata": [
    {
      "id": "metadata-123",
      "user_id": "user-456",
      "cv_hash": "hash123",
      "extracted_info": { /* CV data */ },
      "extraction_status": "completed",
      "confidence_score": 0.9,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "hasMore": false
}
```

### PUT `/cv-metadata/[id]`

Updates specific CV metadata entry.

**Request Body:**
```json
{
  "extractedInfo": {
    "name": "Updated Name",
    "contactInfo": {...},
    // ... other updated fields
  }
}
```

**Response (200):**
```json
{
  "metadata": { /* updated metadata object */ }
}
```

### DELETE `/cv-metadata/[id]`

Deletes a CV metadata entry.

**Response (200):**
```json
{
  "success": true
}
```

---

## Job Position Management

### GET `/job-positions`

Lists user's saved job positions with application tracking.

**Response (200):**
```json
{
  "positions": [
    {
      "id": "position-123",
      "user_id": "user-456",
      "company_name": "Tech Corp",
      "position_title": "Senior Developer",
      "job_description": "Job description text...",
      "match_score": 85,
      "status": "applied",
      "applied_date": "2024-01-15T00:00:00Z",
      "notes": "Followed up on application",
      "created_at": "2024-01-10T00:00:00Z"
    }
  ]
}
```

### POST `/job-positions`

Creates a new job position entry.

**Request Body:**
```json
{
  "company_name": "Tech Corp",
  "position_title": "Senior Developer",
  "job_description": "Full job description...",
  "job_url": "https://example.com/job/123",
  "location": "San Francisco, CA",
  "salary_range": "$120k-160k"
}
```

### GET `/job-positions/[id]`

Retrieves detailed job position information including associated CVs.

**Response (200):**
```json
{
  "id": "position-123",
  "company_name": "Tech Corp",
  "position_title": "Senior Developer",
  "job_description": "...",
  "match_score": 85,
  "tailored_cvs": [
    {
      "id": "cv-456",
      "version": 1,
      "is_active": true,
      "created_at": "2024-01-15T00:00:00Z"
    }
  ]
}
```

### PATCH `/job-positions/[id]`

Updates job position status and tracking information.

**Request Body:**
```json
{
  "status": "interviewing",
  "notes": "Had initial phone screen, preparing for technical interview",
  "applied_date": "2024-01-15T10:30:00Z"
}
```

---

## Career Guidance

### POST `/career-guidance`

Generates personalized career guidance based on user's blueprint.

**Request Body:**
```json
{
  "focus_area": "skill_development" | "career_transition" | "salary_negotiation" | "interview_prep"
}
```

**Response (200):**
```json
{
  "guidance": "# Career Development Plan\n\n## Skill Development Recommendations...",
  "generated_at": "2024-01-20T00:00:00Z"
}
```

---

## Subscription Management

### POST `/create-checkout-session`

Creates a Stripe checkout session for subscription.

**Request Body:**
```json
{
  "price_id": "price_pro_monthly",
  "success_url": "https://yourapp.com/success",
  "cancel_url": "https://yourapp.com/cancel"
}
```

**Response (200):**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

### POST `/webhooks/stripe`

Stripe webhook endpoint for subscription events (no authentication required).

**Headers:**
```
Stripe-Signature: webhook-signature
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Human-readable error message",
  "details": "Additional technical details (optional)"
}
```

### Common HTTP Status Codes

- `200`: Success
- `400`: Bad request (missing/invalid parameters)
- `401`: Unauthorized (missing/invalid authentication)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found
- `429`: Too many requests (rate limited)
- `500`: Internal server error

## Rate Limiting

- **Authenticated requests**: 100 requests per minute per user
- **Anonymous requests**: 10 requests per minute per IP
- **Analysis endpoints**: 5 requests per minute (resource intensive)

## Caching

Several endpoints implement caching to improve performance:

- **Job match analysis**: Cached for 24 hours based on CV and job hashes
- **CV metadata**: Stored permanently for user management
- **Blueprint data**: Updated incrementally as new CVs are processed

## Data Privacy

- All user data is encrypted at rest
- Row-level security ensures users only access their own data
- CV content is processed but not permanently stored (only metadata retained)
- All requests are logged for security auditing

## SDK Examples

### JavaScript/TypeScript

```javascript
import { analyzeCV, getUserCVBlueprint } from './api-client'

// Analyze a CV
const analysis = await analyzeCV(cvContent)
console.log(analysis.analysis)

// Get learning blueprint
const { blueprint } = await getUserCVBlueprint()
console.log(`Confidence: ${blueprint.confidence_score * 100}%`)
```

### cURL Examples

```bash
# Analyze CV
curl -X POST https://api.techcareer.ai/analyze-cv \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"cvContent": "Your CV text here..."}'

# Get blueprint
curl -X GET https://api.techcareer.ai/cv-blueprint \
  -H "Authorization: Bearer your-jwt-token"
```

## Support

For API support or questions:
- Check the [GitHub Issues](https://github.com/your-repo/issues) page
- Review the [Supabase Documentation](https://supabase.com/docs)
- Contact support at support@techcareer.ai
