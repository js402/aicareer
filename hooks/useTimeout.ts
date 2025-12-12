import { useEffect, useRef, useState } from 'react'

export function useTimeout(ms: number) {
    const [done, setDone] = useState(false)
    const timerRef = useRef<number | null>(null)

    useEffect(() => {
        // Reset done state via microtask to avoid synchronous setState warning
        const resetId = window.setTimeout(() => setDone(false), 0)
        if (timerRef.current) {
            clearTimeout(timerRef.current)
        }
        timerRef.current = window.setTimeout(() => {
            setDone(true)
        }, ms)
        return () => {
            clearTimeout(resetId)
            if (timerRef.current) {
                clearTimeout(timerRef.current)
                timerRef.current = null
            }
        }
    }, [ms])

    return done
}

export function useAutoRedirect(ms: number, onRedirect: () => void) {
    const done = useTimeout(ms)
    useEffect(() => {
        if (done) onRedirect()
    }, [done, onRedirect])
}