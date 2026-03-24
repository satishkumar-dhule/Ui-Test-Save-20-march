import React from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/molecules/Card/Card'
import { Text } from '@/components/atoms/Text'
import { cn } from '@/lib/utils/cn'

type ContentType = 'questions' | 'flashcards' | 'exams' | 'voice' | 'coding'

interface ContentCoverageProps {
  perType: Array<{ type: ContentType; count: number }>
  total: number
  loading?: boolean
}

function colorFor(type: ContentType) {
  switch (type) {
    case 'questions':
      return 'var(--theme-primary-color)'
    case 'flashcards':
      return '#8b5cf6'
    case 'exams':
      return '#f59e0b'
    case 'voice':
      return '#a78bfa'
    case 'coding':
      return '#0ea5e9'
  }
}

export function ContentCoverageCard({ perType, total, loading }: ContentCoverageProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-5 w-40 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-muted rounded mb-2" />
          <div className="h-6 bg-muted rounded w-1/2" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span
            className="inline-block w-4 h-4 rounded-full"
            style={{ backgroundColor: colorFor('questions') }}
          />
          Content Coverage
        </CardTitle>
        <CardDescription>Your available content by type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-2">
          {perType.map(item => (
            <span
              key={item.type}
              className="px-3 py-1 rounded-full text-xs border border-border"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'var(--theme-surface-base)',
              }}
            >
              <span
                aria-label={item.type}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 9999,
                  display: 'inline-block',
                  backgroundColor: colorFor(item.type),
                }}
              />
              <span style={{ textTransform: 'capitalize' }}>{item.type}</span>
              <span className="text-muted" style={{ marginLeft: 6 }}>
                {item.count}
              </span>
            </span>
          ))}
        </div>
        <div className="text-xs text-muted">Total: {total} items</div>
      </CardContent>
    </Card>
  )
}

export default ContentCoverageCard
