'use client'

import { useState, useCallback } from 'react'

interface UseModalStateReturn<T> {
  isOpen: boolean
  item: T | null
  open: (item?: T) => void
  close: () => void
  toggle: () => void
  setItem: (item: T | null) => void
}

/**
 * Hook for managing modal/dialog state with associated item
 * Useful for edit modals, delete confirmations, view modals, etc.
 */
export function useModalState<T = any>(): UseModalStateReturn<T> {
  const [isOpen, setIsOpen] = useState(false)
  const [item, setItem] = useState<T | null>(null)

  const open = useCallback((modalItem?: T) => {
    if (modalItem !== undefined) {
      setItem(modalItem)
    }
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    // Clear item after animation completes
    setTimeout(() => setItem(null), 200)
  }, [])

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  return {
    isOpen,
    item,
    open,
    close,
    toggle,
    setItem
  }
}
