/**
 * Backdoor Indicator Component
 *
 * Shows a small indicator when backdoor is active (bottom-right corner)
 * Displays which backdoor was triggered
 *
 * @author DevPrep Team
 * @version 1.0.0
 */

import { memo, useState, useEffect } from 'react'
import type { BackdoorLog } from '@/utils/queryBackdoor'

interface BackdoorIndicatorProps {
  /** Log entries to display */
  log: BackdoorLog[]
  /** Whether the backdoor is currently active */
  active: boolean
  /** Callback to dismiss/clear the indicator */
  onDismiss?: () => void
}

/**
 * Backdoor indicator component
 *
 * Only renders in development mode
 */
function BackdoorIndicatorInner({ log, active, onDismiss }: BackdoorIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  // Auto-hide after 5 seconds if not expanded
  useEffect(() => {
    if (!active || isExpanded) return

    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [active, isExpanded])

  // Don't render in production
  if (!import.meta.env.DEV) return null

  // Don't render if not active or not visible
  if (!active || !isVisible) return null

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  // Get icon for action type
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'page':
        return (
          <svg
            className="w-3 h-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9,22 9,12 15,12 15,22" />
          </svg>
        )
      case 'channel':
        return (
          <svg
            className="w-3 h-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        )
      case 'content':
        return (
          <svg
            className="w-3 h-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10,9 9,9 8,9" />
          </svg>
        )
      case 'tab':
        return (
          <svg
            className="w-3 h-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
          </svg>
        )
      case 'generate':
        return (
          <svg
            className="w-3 h-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        )
      case 'theme':
        return (
          <svg
            className="w-3 h-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        )
      case 'skipOnboarding':
        return (
          <svg
            className="w-3 h-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="13 17 18 12 13 7" />
            <polyline points="6 17 11 12 6 7" />
          </svg>
        )
      default:
        return (
          <svg
            className="w-3 h-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        )
    }
  }

  // Get human-readable label for action
  const getActionLabel = (action: string) => {
    switch (action) {
      case 'page':
        return 'Navigate to'
      case 'channel':
        return 'Channel'
      case 'content':
        return 'Content type'
      case 'tab':
        return 'Tab'
      case 'generate':
        return 'Generate modal'
      case 'theme':
        return 'Theme'
      case 'skipOnboarding':
        return 'Skip onboarding'
      default:
        return action
    }
  }

  // Format value for display
  const formatValue = (value: string | boolean) => {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }
    // Capitalize first letter
    return value.charAt(0).toUpperCase() + value.slice(1)
  }

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        fontSize: 11,
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          border: '1px solid rgba(255, 107, 107, 0.4)',
          borderRadius: 8,
          padding: isExpanded ? 12 : 8,
          minWidth: isExpanded ? 280 : 180,
          maxWidth: 320,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 107, 107, 0.1)',
          backdropFilter: 'blur(12px)',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: isExpanded && log.length > 0 ? 8 : 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ff6b6b"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <span
              style={{
                color: '#ff6b6b',
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              Dev Backdoor
            </span>
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            {/* Expand/collapse button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                borderRadius: 4,
                padding: '2px 6px',
                color: '#888',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.color = '#fff'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.color = '#888'
              }}
            >
              {isExpanded ? (
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              ) : (
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              )}
            </button>

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                borderRadius: 4,
                padding: '2px 6px',
                color: '#888',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255, 100, 100, 0.2)'
                e.currentTarget.style.color = '#ff6b6b'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.color = '#888'
              }}
            >
              <svg
                className="w-3 h-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Expanded content */}
        {isExpanded && log.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              marginTop: 8,
              paddingTop: 8,
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {log.slice(0, 8).map((entry, index) => (
              <div
                key={`${entry.timestamp}-${index}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: '#ccc',
                }}
              >
                <span style={{ color: '#ff6b6b', opacity: 0.7 }}>
                  {getActionIcon(entry.action)}
                </span>
                <span style={{ color: '#888', minWidth: 80 }}>{getActionLabel(entry.action)}:</span>
                <span style={{ color: '#fff', fontWeight: 500 }}>{formatValue(entry.value)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Collapsed summary */}
        {!isExpanded && log.length > 0 && (
          <div style={{ color: '#888', marginTop: 4, fontSize: 10 }}>
            {log[0] && (
              <span>
                {getActionLabel(log[0].action)}:{' '}
                <strong style={{ color: '#fff' }}>{formatValue(log[0].value)}</strong>
                {log.length > 1 && ` +${log.length - 1} more`}
              </span>
            )}
          </div>
        )}

        {/* Timestamp */}
        {isExpanded && log.length > 0 && (
          <div
            style={{
              marginTop: 8,
              paddingTop: 8,
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#555',
              fontSize: 9,
            }}
          >
            Activated at {formatTime(log[0]?.timestamp ?? Date.now())}
          </div>
        )}
      </div>
    </div>
  )
}

export const BackdoorIndicator = memo(BackdoorIndicatorInner)
