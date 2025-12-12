import { NextResponse } from 'next/server'

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfter })
    this.name = 'RateLimitError'
  }
}

export class ExternalServiceError extends ApiError {
  constructor(
    message: string = 'External service error',
    public service?: string
  ) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', { service })
    this.name = 'ExternalServiceError'
  }
}

interface ErrorResponse {
  error: string
  code?: string
  details?: any
  timestamp: string
}

/**
 * Convert an error to a standardized NextResponse
 */
export function errorResponse(error: unknown): NextResponse<ErrorResponse> {
  console.error('API Error:', error)

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
        timestamp: new Date().toISOString()
      },
      { status: error.statusCode }
    )
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: error.message,
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }

  return NextResponse.json(
    {
      error: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString()
    },
    { status: 500 }
  )
}

/**
 * Success response helper
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse<T> {
  return NextResponse.json(data, { status })
}

/**
 * Handle OpenAI rate limit errors with retry information
 */
export function handleOpenAIError(error: any): never {
  if (error.status === 429) {
    const retryAfter = error.headers?.['retry-after']
    throw new RateLimitError(
      error.message || 'OpenAI rate limit exceeded',
      retryAfter ? parseInt(retryAfter) : undefined
    )
  }

  if (error.status >= 500) {
    throw new ExternalServiceError('OpenAI service error', 'openai')
  }

  throw new ApiError(error.message || 'OpenAI request failed', error.status || 500)
}
