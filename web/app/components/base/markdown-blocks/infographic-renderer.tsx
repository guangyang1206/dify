import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import Infographic from '@antv/infographic'
import type { Infographic as InfographicType } from '@antv/infographic'
import { useTranslation } from 'react-i18next'

interface InfographicRendererProps {
  content: string
  theme: 'light' | 'dark'
}

const InfographicRenderer: React.FC<InfographicRendererProps> = memo(({ content, theme }) => {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const infographicRef = useRef<InfographicType | null>(null)
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const processedRef = useRef<boolean>(false)
  const contentRef = useRef<string>('')

  // Cleanup function
  const destroyInfographic = useCallback(() => {
    if (infographicRef.current) {
      try {
        // Infographic cleanup if needed
        infographicRef.current = null
      } catch (e) {
        console.error('Failed to destroy infographic:', e)
      }
    }
  }, [])

  // Initialize or update infographic
  useEffect(() => {
    if (!containerRef.current)
      return

    const trimmedContent = content.trim()
    
    // Skip if content hasn't changed
    if (contentRef.current === trimmedContent)
      return
    contentRef.current = trimmedContent

    // Skip if already processed successfully
    if (processedRef.current && state === 'success')
      return

    // Reset state for new content
    if (!trimmedContent) {
      setState('loading')
      processedRef.current = false
      return
    }

    setState('loading')

    try {
      // Destroy previous instance
      destroyInfographic()

      // Validate and parse infographic syntax
      // Infographic uses a domain-specific syntax, not JSON
      // We'll render it directly
      if (!trimmedContent.startsWith('infographic')) {
        // If it doesn't start with 'infographic', it might be invalid
        console.warn('Invalid infographic syntax: must start with "infographic"')
      }

      // Create new Infographic instance
      const instance = new Infographic({
        container: containerRef.current,
        width: '100%',
        height: '100%',
        theme: theme === 'dark' ? 'dark' : 'light',
        editable: false,
      })

      // Render the infographic
      instance.render(trimmedContent).then(() => {
        infographicRef.current = instance
        setState('success')
        processedRef.current = true
      }).catch((error) => {
        console.error('Infographic render error:', error)
        setErrorMsg(error.message || 'Unknown error')
        setState('error')
        processedRef.current = true
      })
    } catch (error: any) {
      console.error('Infographic initialization error:', error)
      setErrorMsg(error.message || 'Unknown error')
      setState('error')
      processedRef.current = true
    }

    return () => {
      destroyInfographic()
    }
  }, [content, theme, destroyInfographic, state])

  // Handle theme changes
  useEffect(() => {
    if (infographicRef.current && state === 'success') {
      // Re-render with new theme
      try {
        infographicRef.current.destroy()
        const instance = new Infographic({
          container: containerRef.current!,
          width: '100%',
          height: '100%',
          theme: theme === 'dark' ? 'dark' : 'light',
          editable: false,
        })
        infographicRef.current = instance
        instance.render(contentRef.current)
      } catch (error) {
        console.error('Failed to update infographic theme:', error)
      }
    }
  }, [theme, state])

  if (state === 'loading') {
    return (
      <div
        style={{
          minHeight: '350px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme === 'dark' ? 'var(--color-components-input-bg-normal)' : 'transparent',
          color: 'var(--color-text-secondary)',
        }}
      >
        <div style={{ marginBottom: '12px', width: '24px', height: '24px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'spin 1.5s linear infinite' }}>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            <circle opacity="0.2" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M12 2C6.47715 2 2 6.47715 2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div style={{ fontFamily: 'var(--font-family)', fontSize: '14px' }}>
          {t('common.loading') || 'Loading...'}
        </div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div
        style={{
          minHeight: '350px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme === 'dark' ? 'var(--color-components-input-bg-normal)' : 'transparent',
          color: 'var(--color-text-destructive)',
        }}
      >
        <div style={{ fontFamily: 'var(--font-family)', fontSize: '14px', marginBottom: '8px' }}>
          {t('common.error') || 'Error'}: Infographic
        </div>
        <div style={{ fontFamily: 'var(--font-family)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          {errorMsg || t('common.invalidSyntax') || 'Invalid syntax'}
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: '350px',
        width: '100%',
        overflowX: 'auto',
        borderBottomLeftRadius: '10px',
        borderBottomRightRadius: '10px',
        transition: 'background-color 0.3s ease',
      }}
    />
  )
})

InfographicRenderer.displayName = 'InfographicRenderer'

export default InfographicRenderer
