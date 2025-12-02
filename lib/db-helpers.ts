import { supabase } from './supabase'

/**
 * Database helper functions for common Supabase operations
 */

// Example: Upload a file to Supabase Storage
export async function uploadFile(
    bucket: string,
    path: string,
    file: File
) {
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
            cacheControl: '3600',
            upsert: false
        })

    if (error) {
        console.error('Error uploading file:', error)
        throw error
    }

    return data
}

// Example: Get public URL for a file
export function getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)

    return data.publicUrl
}

// Example: Sign in with email and password
export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        console.error('Error signing in:', error)
        throw error
    }

    return data
}

// Example: Sign up with email and password
export async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    })

    if (error) {
        console.error('Error signing up:', error)
        throw error
    }

    return data
}

// Example: Sign out
export async function signOut() {
    const { error } = await supabase.auth.signOut()

    if (error) {
        console.error('Error signing out:', error)
        throw error
    }
}

// Example: Get current user
export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
        console.error('Error getting user:', error)
        throw error
    }

    return user
}

// Example: Insert data into a table
export async function insertData<T>(table: string, data: T) {
    const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()

    if (error) {
        console.error(`Error inserting into ${table}:`, error)
        throw error
    }

    return result
}

// Example: Query data from a table
export async function queryData<T>(
    table: string,
    filters?: Record<string, any>
) {
    let query = supabase.from(table).select('*')

    if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value)
        })
    }

    const { data, error } = await query

    if (error) {
        console.error(`Error querying ${table}:`, error)
        throw error
    }

    return data as T[]
}

// Example: Update data in a table
export async function updateData<T>(
    table: string,
    id: string,
    updates: Partial<T>
) {
    const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()

    if (error) {
        console.error(`Error updating ${table}:`, error)
        throw error
    }

    return data
}

// Example: Delete data from a table
export async function deleteData(table: string, id: string) {
    const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)

    if (error) {
        console.error(`Error deleting from ${table}:`, error)
        throw error
    }
}
