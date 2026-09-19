import { type ReactNode, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/utils'

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

type DialogProps = {
  labelledBy: string
  onClose: () => void
  children: ReactNode
  placement?: 'center' | 'bottom'
  className?: string
}

// Modal/drawer acessivel: foco inicial no primeiro campo, Tab preso no painel, Escape fecha e o
// foco volta para o elemento que abriu o dialogo.
export function Dialog({ labelledBy, onClose, children, placement = 'center', className }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const focusables = () => Array.from(panel?.querySelectorAll<HTMLElement>(focusableSelector) ?? [])
    const initial = panel?.querySelector<HTMLElement>('input:not([disabled]), select:not([disabled])') ?? focusables()[0]
    ;(initial ?? panel)?.focus()

    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusables()
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = overflow
      opener?.focus?.()
    }
  }, [])

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 grid overflow-y-auto bg-[#080403]/72 backdrop-blur-sm',
        placement === 'center' ? 'min-h-screen place-items-center px-4 py-6' : 'items-end',
      )}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1} className={cn('outline-none', className)}>
        {children}
      </div>
    </div>,
    document.body,
  )
}
