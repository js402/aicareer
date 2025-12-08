import { createServerSupabaseClient } from './supabase-server'

/**
 * Check if the database is properly set up with required functions and tables
 */
export async function checkDatabaseSetup(): Promise<{
    isSetup: boolean
    missing: string[]
    errors: string[]
}> {
    const missing: string[] = []
    const errors: string[] = []

    try {
        const supabase = await createServerSupabaseClient()

        // Check if required tables exist
        const tables = ['cv_blueprints', 'cv_metadata', 'job_positions', 'subscriptions', 'rate_limits']
        for (const table of tables) {
            try {
                const { error } = await supabase
                    .from(table)
                    .select('count', { count: 'exact', head: true })

                if (error) {
                    missing.push(`Table: ${table}`)
                }
            } catch (_error) {
                missing.push(`Table: ${table}`)
            }
        }

        // Check if required RPC functions exist
        const rpcFunctions = ['get_or_create_cv_blueprint', 'record_blueprint_change']
        for (const func of rpcFunctions) {
            try {
                // Try to call the function with invalid params to check if it exists
                const { error } = await supabase.rpc(func, { invalid_param: 'test' })
                if (error && error.message?.includes('does not exist')) {
                    missing.push(`RPC Function: ${func}`)
                }
            } catch (_error) {
                missing.push(`RPC Function: ${func}`)
            }
        }

    } catch (error) {
        errors.push(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return {
        isSetup: missing.length === 0 && errors.length === 0,
        missing,
        errors
    }
}

/**
 * Get setup instructions for missing components
 */
export function getSetupInstructions(missing: string[]): string {
    const instructions: string[] = []

    if (missing.some(item => item.includes('Table'))) {
        instructions.push('• Run database migrations: `supabase db push`')
    }

    if (missing.some(item => item.includes('RPC Function'))) {
        instructions.push('• Ensure all migration files are applied')
    }

    if (instructions.length === 0) {
        instructions.push('• Check your Supabase configuration and connection')
    }

    return instructions.join('\n')
}
