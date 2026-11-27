import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface UseDialogFocusOptions {
  isOpen: boolean
  dialogRef: RefObject<HTMLElement | null>
  onClose?: () => void
  restoreFocusRef?: RefObject<HTMLElement | null>
}

export function useDialogFocus({
  isOpen,
  dialogRef,
  onClose,
  restoreFocusRef,
}: UseDialogFocusOptions): void {
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return

    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const restoreTarget = restoreFocusRef?.current ?? previousFocus
    const container = dialogRef.current

    if (container) {
      const firstFocusable = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
      ;(firstFocusable ?? container).focus()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (onCloseRef.current) {
          e.stopImmediatePropagation()
          onCloseRef.current()
        }
        return
      }
      if (e.key !== 'Tab' || !dialogRef.current) return

      const focusables = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      )
      if (focusables.length === 0) {
        e.preventDefault()
        dialogRef.current.focus()
        return
      }

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (
        e.shiftKey &&
        (document.activeElement === first || !dialogRef.current.contains(document.activeElement))
      ) {
        e.preventDefault()
        last.focus()
      } else if (
        !e.shiftKey &&
        (document.activeElement === last || !dialogRef.current.contains(document.activeElement))
      ) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (restoreTarget && restoreTarget.isConnected) {
        restoreTarget.focus()
      }
    }
  }, [isOpen, dialogRef, restoreFocusRef])
}
