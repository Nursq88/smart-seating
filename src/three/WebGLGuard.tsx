import { Component, useState, type ReactNode } from 'react'
import { useLang } from '../lib/i18n'

/** three.js draws with WebGL 2 only. */
function hasWebGL() {
  try {
    return !!document.createElement('canvas').getContext('webgl2')
  } catch {
    return false
  }
}

class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/**
 * Draws its 3D children only when the device can, and shows a short note instead when it cannot
 * or when drawing fails, so a missing graphics driver never blanks the whole page.
 */
export function WebGLGuard({ children, hint }: { children: ReactNode; hint: string }) {
  const { t } = useLang()
  const [webgl] = useState(hasWebGL)
  const fallback = (
    <div className="flex h-full w-full items-center justify-center p-6 text-center" role="status">
      <div className="max-w-xs">
        <div className="font-medium">{t('3D view is not available on this device')}</div>
        <p className="mt-1 text-sm text-stone-600">{hint}</p>
      </div>
    </div>
  )
  return webgl ? <Boundary fallback={fallback}>{children}</Boundary> : fallback
}
