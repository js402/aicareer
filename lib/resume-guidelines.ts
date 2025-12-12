/**
 * Resume Guidelines & Best Practices
 * Based on Harvard MCS Resume Guide and IT CV Best Practices
 * 
 * These constants are injected into AI prompts for CV analysis,
 * extraction, tailoring, and generation.
 */

// ============================================================
// ACTION VERBS BY CATEGORY
// ============================================================

export const ACTION_VERBS = {
    leadership: [
        'Accomplished', 'Achieved', 'Administered', 'Analyzed', 'Assigned', 'Attained',
        'Chaired', 'Consolidated', 'Contracted', 'Coordinated', 'Delegated', 'Developed',
        'Directed', 'Earned', 'Evaluated', 'Executed', 'Handled', 'Headed', 'Impacted',
        'Improved', 'Increased', 'Led', 'Mastered', 'Orchestrated', 'Organized', 'Oversaw',
        'Planned', 'Predicted', 'Prioritized', 'Produced', 'Proved', 'Recommended',
        'Regulated', 'Reorganized', 'Reviewed', 'Scheduled', 'Spearheaded', 'Strengthened',
        'Supervised', 'Surpassed'
    ],
    communication: [
        'Addressed', 'Arbitrated', 'Arranged', 'Authored', 'Collaborated', 'Convinced',
        'Corresponded', 'Delivered', 'Developed', 'Directed', 'Documented', 'Drafted',
        'Edited', 'Energized', 'Enlisted', 'Formulated', 'Influenced', 'Interpreted',
        'Lectured', 'Liaised', 'Mediated', 'Moderated', 'Negotiated', 'Persuaded',
        'Presented', 'Promoted', 'Publicized', 'Reconciled', 'Recruited', 'Reported',
        'Rewrote', 'Spoke', 'Suggested', 'Synthesized', 'Translated', 'Verbalized', 'Wrote'
    ],
    research: [
        'Clarified', 'Collected', 'Concluded', 'Conducted', 'Constructed', 'Critiqued',
        'Derived', 'Determined', 'Diagnosed', 'Discovered', 'Evaluated', 'Examined',
        'Extracted', 'Formed', 'Identified', 'Inspected', 'Interpreted', 'Interviewed',
        'Investigated', 'Modeled', 'Organized', 'Resolved', 'Reviewed', 'Summarized',
        'Surveyed', 'Systematized', 'Tested'
    ],
    technical: [
        'Assembled', 'Built', 'Calculated', 'Computed', 'Designed', 'Devised', 'Engineered',
        'Fabricated', 'Installed', 'Maintained', 'Operated', 'Optimized', 'Overhauled',
        'Programmed', 'Remodeled', 'Repaired', 'Solved', 'Standardized', 'Streamlined',
        'Upgraded', 'Automated', 'Configured', 'Deployed', 'Implemented', 'Integrated',
        'Migrated', 'Refactored', 'Scaled', 'Architected'
    ],
    teaching: [
        'Adapted', 'Advised', 'Clarified', 'Coached', 'Communicated', 'Coordinated',
        'Demystified', 'Developed', 'Enabled', 'Encouraged', 'Evaluated', 'Explained',
        'Facilitated', 'Guided', 'Informed', 'Instructed', 'Mentored', 'Persuaded',
        'Stimulated', 'Studied', 'Taught', 'Trained'
    ],
    quantitative: [
        'Administered', 'Allocated', 'Analyzed', 'Appraised', 'Audited', 'Balanced',
        'Budgeted', 'Calculated', 'Computed', 'Developed', 'Forecasted', 'Managed',
        'Marketed', 'Maximized', 'Minimized', 'Planned', 'Projected', 'Researched'
    ],
    creative: [
        'Acted', 'Composed', 'Conceived', 'Conceptualized', 'Created', 'Customized',
        'Designed', 'Developed', 'Directed', 'Established', 'Fashioned', 'Founded',
        'Illustrated', 'Initiated', 'Instituted', 'Integrated', 'Introduced', 'Invented',
        'Originated', 'Performed', 'Planned', 'Published', 'Redesigned', 'Revised',
        'Revitalized', 'Shaped', 'Visualized'
    ],
    organizational: [
        'Approved', 'Accelerated', 'Added', 'Arranged', 'Broadened', 'Cataloged',
        'Centralized', 'Changed', 'Classified', 'Collected', 'Compiled', 'Completed',
        'Controlled', 'Defined', 'Dispatched', 'Executed', 'Expanded', 'Gained',
        'Gathered', 'Generated', 'Implemented', 'Inspected', 'Launched', 'Monitored',
        'Operated', 'Organized', 'Prepared', 'Processed', 'Purchased', 'Recorded',
        'Reduced', 'Reinforced', 'Retrieved', 'Screened', 'Selected', 'Simplified',
        'Sold', 'Specified', 'Steered', 'Structured', 'Systematized', 'Tabulated',
        'Unified', 'Updated', 'Utilized', 'Validated', 'Verified'
    ]
}

// Flatten for quick lookup
export const ALL_ACTION_VERBS = Object.values(ACTION_VERBS).flat()

// ============================================================
// RESUME LANGUAGE RULES
// ============================================================

export const RESUME_LANGUAGE_RULES = `
RESUME LANGUAGE SHOULD BE:
- Specific rather than general
- Active rather than passive
- Written to express not impress
- Articulate rather than "flowery"
- Fact-based (quantify and qualify with numbers, percentages, dollar amounts)
- Written for people who scan quickly AND ATS systems

DO NOT:
- Use personal pronouns (I, We, My, Our)
- Use abbreviations without context
- Use narrative style or storytelling prose
- Use slang or colloquialisms
- Include pictures, age, or gender references
- List references on the resume
- Start lines with dates

DO:
- Start bullet points with strong ACTION VERBS
- Be consistent in format and content
- Balance white space for readability
- Use consistent spacing, bold, and capitalization for emphasis
- List headings in order of importance to the target role
- Within sections, list items in reverse chronological order (most recent first)
- Ensure formatting translates properly to PDF and plain text
`

// ============================================================
// TOP RESUME MISTAKES TO CHECK
// ============================================================

export const TOP_RESUME_MISTAKES = [
    'Spelling and grammar errors',
    'Missing email and phone information',
    'Using passive language instead of action verbs',
    'Not well organized, concise, or easy to skim',
    'Not demonstrating results or measurable outcomes',
    'Generic descriptions without specific context',
    'Unexplained gaps in employment history',
    'Inconsistent formatting or date styles',
    'Overly long bullets or dense paragraphs',
    'Missing technical context (tools, scale, environment)'
]

// ============================================================
// SENIORITY LEVEL DEFINITIONS
// ============================================================

export const SENIORITY_LEVELS = {
    entry: {
        label: 'Entry Level / Intern',
        yearsExperience: '0-1',
        characteristics: [
            'Academic projects and coursework',
            'Internships and part-time roles',
            'Foundational technical skills',
            'Learning and growth orientation'
        ],
        resumeFocus: 'Education, projects, transferable skills, eagerness to learn'
    },
    junior: {
        label: 'Junior',
        yearsExperience: '1-3',
        characteristics: [
            'Some professional experience',
            'Growing technical depth',
            'Works under supervision',
            'Executes well-defined tasks'
        ],
        resumeFocus: 'Technical skills, project contributions, learning trajectory'
    },
    mid: {
        label: 'Mid-Level',
        yearsExperience: '3-6',
        characteristics: [
            'Independent contributor',
            'Owns features or components',
            'Mentors juniors occasionally',
            'Solid technical judgment'
        ],
        resumeFocus: 'Technical achievements, project ownership, measurable impact'
    },
    senior: {
        label: 'Senior',
        yearsExperience: '6-10',
        characteristics: [
            'Technical leadership on projects',
            'Influences architecture decisions',
            'Mentors team members',
            'Cross-team collaboration'
        ],
        resumeFocus: 'Technical leadership, system design, mentorship, business impact'
    },
    lead: {
        label: 'Lead / Staff',
        yearsExperience: '8-12',
        characteristics: [
            'Leads technical direction for team/area',
            'Sets standards and best practices',
            'Influences roadmap',
            'Technical authority'
        ],
        resumeFocus: 'Technical vision, team influence, process improvements, org-level impact'
    },
    principal: {
        label: 'Principal / Architect',
        yearsExperience: '10-15',
        characteristics: [
            'Organization-wide technical influence',
            'Defines architecture strategy',
            'Drives major initiatives',
            'External thought leadership'
        ],
        resumeFocus: 'Strategic technical decisions, cross-org impact, innovation, industry influence'
    },
    director: {
        label: 'Director / VP',
        yearsExperience: '12+',
        characteristics: [
            'Manages managers or large teams',
            'Budget and resource ownership',
            'Executive stakeholder management',
            'Business strategy alignment'
        ],
        resumeFocus: 'Team/org leadership, P&L impact, strategic initiatives, executive presence'
    },
    executive: {
        label: 'Executive (C-Level)',
        yearsExperience: '15+',
        characteristics: [
            'Company-wide or division-wide scope',
            'Board-level reporting',
            'Business transformation',
            'Industry recognition'
        ],
        resumeFocus: 'Business outcomes, transformation, governance, market/industry impact'
    }
}

// ============================================================
// BULLET POINT FORMULA
// ============================================================

export const BULLET_FORMULA = `
Each bullet point should follow the "Skill + Tool + Result" or "Action + Context + Impact" pattern:

FORMULA: [Action Verb] + [What you did] + [How/With what] + [Quantified Result]

EXAMPLES:
✓ "Migrated a 500-user environment to Azure with zero downtime"
✓ "Reduced incident response time by 40% through automated alerting"
✓ "Led a team of 5 engineers to deliver the payment platform 2 weeks ahead of schedule"
✓ "Built CI/CD pipelines with Jenkins and Docker, reducing release time by 30%"

AVOID:
✗ "Responsible for managing projects" (passive, no outcome)
✗ "Worked on various tasks" (vague, no specifics)
✗ "I helped the team with deployments" (uses pronoun, weak verb)
`

// ============================================================
// DIRECTOR/EXECUTIVE LEVEL GUIDANCE
// ============================================================

export const DIRECTOR_LEVEL_GUIDANCE = `
For director-level and above resumes, emphasize:

1. SCOPE & SCALE
   - Team sizes managed (direct reports, total org)
   - Budget ownership (P&L, cost centers, investment)
   - Geographic or business unit scope
   - Revenue/cost impact in actual numbers

2. STRATEGIC IMPACT
   - Business outcomes (revenue growth, cost reduction, market share)
   - Transformation initiatives led
   - Strategic partnerships or M&A involvement
   - Board or executive committee presentations

3. LEADERSHIP & INFLUENCE
   - Cross-functional leadership
   - Executive stakeholder management
   - Culture and organizational development
   - Talent acquisition and team building at scale

4. INDUSTRY PRESENCE
   - Speaking engagements, publications
   - Advisory roles, board positions
   - Industry recognition or awards
   - Thought leadership

Example director-level bullets:
✓ "Scaled engineering organization from 15 to 85 engineers across 3 continents while maintaining 95% retention"
✓ "Drove $12M annual cost reduction through cloud optimization and vendor consolidation"
✓ "Led digital transformation initiative resulting in 40% improvement in customer acquisition cost"
✓ "Established engineering excellence program adopted by 500+ engineers across 12 product teams"
`

// ============================================================
// STANDARD RESUME SECTIONS
// ============================================================

export const STANDARD_SECTIONS = {
    required: ['Contact Information', 'Education', 'Experience'],
    recommended: ['Skills', 'Summary/Profile'],
    optional: [
        'Projects',
        'Certifications',
        'Leadership & Activities',
        'Publications',
        'Awards & Honors',
        'Languages',
        'Interests'
    ],
    specialized: [
        'Research Experience',
        'Teaching Experience',
        'Public Service',
        'Performing Arts',
        'Portfolio/Creative Work'
    ]
}

// ============================================================
// SKILL INFERENCE PATTERNS
// ============================================================

export const SKILL_INFERENCE_HINTS = `
When extracting skills from a CV, look for:

1. EXPLICIT SKILL SECTIONS
   - "Skills:", "Technical Skills:", "Core Competencies:", etc.
   - Programming languages, frameworks, tools listed directly

2. SKILLS EMBEDDED IN EXPERIENCE
   - "...using React and Node.js" → React, Node.js
   - "...managed AWS infrastructure" → AWS, Cloud Infrastructure
   - "...wrote Python scripts for automation" → Python, Automation

3. SKILLS IMPLIED BY ROLE/RESPONSIBILITY
   - "Teaching Fellow" → Teaching, Mentoring, Communication
   - "Led team of 5" → Leadership, Team Management
   - "Presented to stakeholders" → Presentation, Stakeholder Management

4. SKILLS FROM EDUCATION
   - "BS in Computer Science" → CS Fundamentals, Algorithms, Data Structures
   - Relevant coursework listed → specific technical areas

5. SKILLS FROM PROJECTS
   - Technologies used in project descriptions
   - Methodologies mentioned (Agile, Scrum, etc.)

6. NORMALIZE SYNONYMS
   - "React" = "React.js" = "ReactJS"
   - "Node" = "Node.js" = "NodeJS"
   - "Postgres" = "PostgreSQL"
   - "K8s" = "Kubernetes"
`

// ============================================================
// PROMPT FRAGMENTS FOR INJECTION
// ============================================================

export function getExtractionPromptFragment(): string {
    return `
${RESUME_LANGUAGE_RULES}

SKILL EXTRACTION RULES:
${SKILL_INFERENCE_HINTS}

SENIORITY INFERENCE:
Infer the candidate's seniority level based on:
- Total years of professional experience
- Scope of responsibilities (individual contributor vs team lead vs org leader)
- Title progression
- Budget/team size ownership
Use levels: entry, junior, mid, senior, lead, principal, director, executive
`
}

export function getAnalysisPromptFragment(): string {
    return `
EVALUATION CRITERIA:
${RESUME_LANGUAGE_RULES}

TOP MISTAKES TO CHECK:
${TOP_RESUME_MISTAKES.map((m, i) => `${i + 1}. ${m}`).join('\n')}

BULLET POINT QUALITY:
${BULLET_FORMULA}

FOR SENIOR/DIRECTOR PROFILES:
${DIRECTOR_LEVEL_GUIDANCE}
`
}

export function getTailoringPromptFragment(): string {
    return `
RESUME WRITING RULES:
${RESUME_LANGUAGE_RULES}

BULLET POINT FORMULA:
${BULLET_FORMULA}

ACTION VERBS TO USE:
Leadership: ${ACTION_VERBS.leadership.slice(0, 15).join(', ')}...
Technical: ${ACTION_VERBS.technical.join(', ')}
Communication: ${ACTION_VERBS.communication.slice(0, 15).join(', ')}...

FOR DIRECTOR+ ROLES:
${DIRECTOR_LEVEL_GUIDANCE}
`
}
