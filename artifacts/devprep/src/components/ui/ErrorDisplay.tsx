import { RefreshCw, AlertCircle, Wifi, Database, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorDisplayProps {
  title?: string
  message: string
  type?: 'network' | 'database' | 'generic' | 'parse'
  onRetry?: () => void
  showDetails?: boolean
  details?: string
}

const ERROR_ICONS = {
  network: Wifi,
  database: Database,
  parse: AlertTriangle,
  generic: AlertCircle,
}

const ERROR_COLORS = {
  network: 'hsl(var(--chart-3))',
  database: 'hsl(var(--chart-5))',
  parse: 'hsl(var(--destructive))',
  generic: 'hsl(var(--muted-foreground))',
}

export function ErrorDisplay({
  title,
  message,
  type = 'generic',
  onRetry,
  showDetails = false,
  details,
}: ErrorDisplayProps) {
  const Icon = ERROR_ICONS[type]
  const color = ERROR_COLORS[type]

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
        style={{
          background: `${color}15`,
          border: `2px solid ${color}40`,
        }}
      >
        <Icon size={32} style={{ color }} aria-hidden="true" />
      </div>

      <h2 className="text-xl font-bold text-foreground mb-2">{title || 'Something went wrong'}</h2>

      <p className="text-sm text-muted-foreground mb-2 max-w-md">{message}</p>

      {showDetails && details && (
        <details className="mt-4 p-3 rounded-lg bg-muted/50 text-left w-full max-w-md">
          <summary className="text-xs font-semibold text-muted-foreground cursor-pointer">
            Technical Details
          </summary>
          <pre className="mt-2 text-xs text-destructive overflow-auto max-h-32 whitespace-pre-wrap">
            {details}
          </pre>
        </details>
      )}

      {onRetry && (
        <Button onClick={onRetry} variant="default" className="btn-micro mt-6">
          <RefreshCw size={14} aria-hidden="true" />
          Try Again
        </Button>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        If this problem persists, please refresh the page or contact support.
      </p>
    </div>
  )
}

export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
      <AlertCircle size={14} className="text-destructive shrink-0" />
      <span className="text-destructive flex-1">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="text-xs text-destructive hover:underline shrink-0">
          Retry
        </button>
      )}
    </div>
  )
}
