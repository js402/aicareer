import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse contact info string into structured ContactInfo object
 */
export function parseContactInfoString(contactInfo: string): ContactInfo {
  const parsed: ContactInfo = {}

  if (!contactInfo || typeof contactInfo !== 'string') {
    return parsed
  }

  const contactString = contactInfo.toLowerCase()

  // Email extraction (basic regex)
  const emailMatch = contactString.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
  if (emailMatch) {
    parsed.email = emailMatch[1]
  }

  // Phone extraction (basic patterns)
  const phonePatterns = [
    /(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/, // US format
    /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/, // International
    /\d{10,15}/ // Raw digits
  ]

  for (const pattern of phonePatterns) {
    const phoneMatch = contactString.match(pattern)
    if (phoneMatch) {
      parsed.phone = phoneMatch[0].replace(/[^\d+\-\s()]/g, '') // Clean up
      break
    }
  }

  // LinkedIn extraction
  const linkedinMatch = contactString.match(/(?:linkedin\.com\/in\/|linkedin:?\s*)([a-zA-Z0-9-]+)/i)
  if (linkedinMatch) {
    parsed.linkedin = linkedinMatch[1]
  }

  // Website extraction (basic)
  const websiteMatch = contactString.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})(?:\/[^\s]*)?/i)
  if (websiteMatch && !websiteMatch[1].includes('linkedin')) {
    parsed.website = websiteMatch[1]
  }

  // Location extraction (remaining text, usually at the end)
  let locationText = contactString
    .replace(parsed.email || '', '')
    .replace(parsed.phone || '', '')
    .replace(/linkedin\.com\/in\/[a-zA-Z0-9-]+/i, '')
    .replace(/https?:\/\/[^\s]+/gi, '')
    .replace(/[^\w\s,.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (locationText && locationText.length > 3) {
    parsed.location = locationText
  }

  return parsed
}

export interface ContactInfo {
  email?: string
  phone?: string
  location?: string
  linkedin?: string
  website?: string
}
