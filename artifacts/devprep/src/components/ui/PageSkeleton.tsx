/**
 * Page Skeleton Components
 *
 * Skeleton loaders that match the exact layout structure of each page.
 * Used as Suspense fallbacks during lazy loading.
 *
 * Features:
 * - Page-specific skeleton layouts
 * - Animated shimmer effect
 * - Accessibility-friendly (aria-hidden)
 * - Match exact component structure
 */

import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export type PageSkeletonType =
  | 'qa'
  | 'flashcards'
  | 'exam'
  | 'voice'
  | 'coding'
  | 'dashboard'
  | 'ai'
  | 'onboarding'
  | 'notFound'

interface PageSkeletonProps {
  type: PageSkeletonType
  title?: string
  className?: string
}

export function PageSkeleton({ type, title, className }: PageSkeletonProps) {
  const skeletonContent = getSkeletonForType(type)

  return (
    <div className={cn('flex flex-1 h-full overflow-hidden', className)} aria-hidden="true">
      {skeletonContent}
    </div>
  )
}

function getSkeletonForType(type: PageSkeletonType): React.ReactNode {
  switch (type) {
    case 'qa':
      return <QASkeleton />
    case 'flashcards':
      return <FlashcardsSkeleton />
    case 'exam':
      return <ExamSkeleton />
    case 'voice':
      return <VoiceSkeleton />
    case 'coding':
      return <CodingSkeleton />
    case 'dashboard':
      return <DashboardSkeleton />
    case 'ai':
      return <AISkeleton />
    case 'onboarding':
      return <OnboardingSkeleton />
    case 'notFound':
      return <NotFoundSkeleton />
    default:
      return <DefaultSkeleton />
  }
}

function QASkeleton() {
  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Sidebar */}
      <div className="flex-shrink-0 flex-col border-r border-border overflow-hidden bg-card w-64 hidden md:flex">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Skeleton className="w-20 h-4" />
          <Skeleton className="w-8 h-5 ml-auto rounded-full" />
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-3 py-2.5 mb-1">
              <div className="flex items-center gap-2 mb-1">
                <Skeleton className="w-10 h-3" />
                <Skeleton className="w-8 h-3" />
              </div>
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-3/4 h-4 mt-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div
          className="flex items-center gap-2 px-4 border-b border-border bg-card/50"
          style={{ height: 44 }}
        >
          <Skeleton className="w-8 h-8 rounded md:hidden" />
          <Skeleton className="w-32 h-7 rounded" />
          <Skeleton className="flex-1 h-7 rounded" />
          <Skeleton className="w-16 h-4 ml-auto" />
          <Skeleton className="w-7 h-7 rounded" />
          <Skeleton className="w-7 h-7 rounded" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Question Header */}
            <div className="p-4 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="w-20 h-5 rounded-full" />
                <Skeleton className="w-16 h-5 rounded-full" />
              </div>
              <Skeleton className="w-full h-7 mb-3 rounded" />
              <div className="flex items-center gap-4 mb-3">
                <Skeleton className="w-12 h-4" />
                <Skeleton className="w-12 h-4" />
                <Skeleton className="w-24 h-4" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Skeleton className="w-16 h-5 rounded" />
                <Skeleton className="w-20 h-5 rounded" />
                <Skeleton className="w-14 h-5 rounded" />
              </div>
            </div>

            {/* Answer Section */}
            <div className="p-4 rounded-lg border border-border">
              <Skeleton className="w-16 h-5 mb-3" />
              <Skeleton className="w-full h-4 mb-2" />
              <Skeleton className="w-full h-4 mb-2" />
              <Skeleton className="w-3/4 h-4" />
            </div>

            {/* Code Block */}
            <div className="p-4 rounded-lg border border-border">
              <Skeleton className="w-24 h-5 mb-3" />
              <Skeleton className="w-full h-32 rounded" />
            </div>

            {/* Related Topics */}
            <div className="p-4 rounded-lg border border-border">
              <Skeleton className="w-28 h-5 mb-3" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="w-full h-20 rounded" />
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="w-24 h-8 rounded" />
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="w-1 h-1 rounded-full" />
                ))}
              </div>
              <Skeleton className="w-16 h-8 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FlashcardsSkeleton() {
  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Sidebar */}
      <div className="flex-shrink-0 flex-col border-r border-border overflow-hidden bg-card w-72 hidden md:flex">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Skeleton className="w-20 h-4" />
          <Skeleton className="w-8 h-5 ml-auto rounded-full" />
        </div>

        {/* Progress */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex justify-between mb-1.5">
            <Skeleton className="w-16 h-2" />
            <Skeleton className="w-8 h-2" />
          </div>
          <Skeleton className="w-full h-1.5 rounded-full" />
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-2 gap-1.5 p-3 border-b border-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 rounded-md" />
          ))}
        </div>

        {/* Card List */}
        <div className="flex-1 overflow-y-auto p-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-3 py-2.5 mb-1">
              <div className="flex items-center gap-2">
                <Skeleton className="w-2 h-2 rounded-full" />
                <Skeleton className="flex-1 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div
          className="flex items-center gap-2 px-4 border-b border-border bg-card/50"
          style={{ height: 44 }}
        >
          <Skeleton className="w-8 h-8 rounded md:hidden" />
          <Skeleton className="w-20 h-6 rounded" />
          <Skeleton className="w-20 h-6 rounded" />
          <Skeleton className="w-16 ml-auto h-6 rounded" />
          <Skeleton className="w-6 h-6 rounded" />
          <Skeleton className="w-6 h-6 rounded" />
        </div>

        {/* Card Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
          <div className="w-full max-w-xl" style={{ perspective: 1000 }}>
            <div className="rounded-xl border border-border bg-card p-6" style={{ minHeight: 280 }}>
              <Skeleton className="w-20 h-3 mb-4" />
              <Skeleton variant="heading" className="w-full mb-3" />
              <Skeleton className="w-3/4 mx-auto h-4 mb-2" />
              <Skeleton className="w-1/2 mx-auto h-4 mb-4" />
              <Skeleton className="w-32 mx-auto h-3" />
            </div>
          </div>

          {/* Status Chips */}
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="w-20 h-6 rounded-full" />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Skeleton className="w-24 h-10 rounded-lg" />
            <Skeleton className="w-24 h-10 rounded-lg" />
            <Skeleton className="w-24 h-10 rounded-lg" />
          </div>

          <Skeleton className="w-48 h-4" />
        </div>
      </div>
    </div>
  )
}

function ExamSkeleton() {
  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Sidebar */}
      <div className="flex-shrink-0 flex-col border-r border-border overflow-hidden bg-card w-72 hidden md:flex">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Skeleton className="w-20 h-4" />
          <Skeleton className="w-24 h-5 ml-auto rounded" />
        </div>
        <div className="p-4 border-b border-border">
          <Skeleton className="w-full h-8 mb-2 rounded" />
          <Skeleton className="w-full h-2 rounded-full" />
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 mb-1">
              <Skeleton className="w-6 h-6 rounded" />
              <Skeleton className="flex-1 h-4" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div
          className="flex items-center gap-2 px-4 border-b border-border bg-card/50"
          style={{ height: 56 }}
        >
          <Skeleton className="w-8 h-8 rounded md:hidden" />
          <Skeleton className="w-40 h-7" />
          <Skeleton className="w-24 h-7 ml-auto rounded" />
          <Skeleton className="w-32 h-7 rounded" />
        </div>

        {/* Question */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Question Header */}
            <div className="p-4 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="w-24 h-5 rounded-full" />
                <Skeleton className="w-16 h-5 rounded-full" />
              </div>
              <Skeleton className="w-full h-6 mb-2" />
              <Skeleton className="w-full h-6 mb-2" />
              <Skeleton className="w-2/3 h-6" />
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <Skeleton className="flex-1 h-5" />
                  </div>
                </div>
              ))}
            </div>

            {/* Explanation */}
            <div className="p-4 rounded-lg border border-border">
              <Skeleton className="w-24 h-5 mb-3" />
              <Skeleton className="w-full h-4 mb-2" />
              <Skeleton className="w-full h-4 mb-2" />
              <Skeleton className="w-3/4 h-4" />
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Skeleton className="w-32 h-10 rounded" />
              <Skeleton className="w-32 h-10 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function VoiceSkeleton() {
  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Sidebar */}
      <div className="flex-shrink-0 flex-col border-r border-border overflow-hidden bg-card w-72 hidden md:flex">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Skeleton className="w-20 h-4" />
          <Skeleton className="w-8 h-5 ml-auto rounded-full" />
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-3 py-2.5 mb-1">
              <Skeleton className="w-full h-12 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div
          className="flex items-center gap-2 px-4 border-b border-border bg-card/50"
          style={{ height: 44 }}
        >
          <Skeleton className="w-8 h-8 rounded md:hidden" />
          <Skeleton className="w-32 h-7 rounded" />
          <Skeleton className="w-16 ml-auto h-4" />
          <Skeleton className="w-6 h-6 rounded" />
          <Skeleton className="w-6 h-6 rounded" />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          {/* Difficulty Badge */}
          <Skeleton className="w-28 h-6 rounded-full" />

          {/* Prompt Card */}
          <div className="w-full max-w-lg p-6 rounded-xl border border-border bg-card">
            <Skeleton className="w-full h-16 mb-4 rounded" />
            <Skeleton className="w-full h-24 rounded" />
          </div>

          {/* Waveform */}
          <div className="flex items-end gap-1 h-16">
            {Array.from({ length: 20 }).map((_, i) => (
              <Skeleton
                key={i}
                className="w-2 rounded"
                style={{ height: `${20 + Math.random() * 60}%` }}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-full" />
            <Skeleton className="w-16 h-16 rounded-full" />
            <Skeleton className="w-12 h-12 rounded-full" />
          </div>

          {/* Rating */}
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="w-8 h-8 rounded" />
            ))}
          </div>

          {/* Key Points */}
          <Skeleton className="w-full max-w-lg h-20 rounded" />
        </div>
      </div>
    </div>
  )
}

function CodingSkeleton() {
  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Sidebar */}
      <div className="flex-shrink-0 flex-col border-r border-border overflow-hidden bg-card w-72 hidden md:flex">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Skeleton className="w-20 h-4" />
          <Skeleton className="w-8 h-5 ml-auto rounded-full" />
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-3 py-2.5 mb-1">
              <Skeleton className="w-full h-4 mb-1" />
              <Skeleton className="w-16 h-3" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div
          className="flex items-center gap-2 px-4 border-b border-border bg-card/50"
          style={{ height: 44 }}
        >
          <Skeleton className="w-8 h-8 rounded md:hidden" />
          <Skeleton className="w-40 h-7 rounded" />
          <Skeleton className="w-20 h-6 ml-auto rounded" />
          <Skeleton className="w-6 h-6 rounded" />
          <Skeleton className="w-6 h-6 rounded" />
        </div>

        {/* Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Problem */}
          <div className="flex-1 overflow-y-auto p-4 border-r border-border">
            <div className="space-y-4">
              <Skeleton className="w-full h-6" />
              <div className="flex gap-2">
                <Skeleton className="w-16 h-5 rounded-full" />
                <Skeleton className="w-20 h-5 rounded-full" />
              </div>
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-3/4 h-4" />
              <Skeleton className="w-full h-24 rounded" />
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/30">
              <Skeleton className="w-20 h-5" />
              <Skeleton className="w-16 h-5 ml-auto rounded" />
            </div>
            <div className="flex-1 p-4">
              <Skeleton className="w-full h-full rounded" />
            </div>
            <div className="flex items-center gap-2 px-4 py-2 border-t border-border">
              <Skeleton className="w-24 h-8 rounded" />
              <Skeleton className="w-16 h-8 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Skeleton className="w-48 h-8 mb-2" />
              <Skeleton className="w-32 h-4" />
            </div>
            <Skeleton className="w-32 h-10 rounded" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>

          {/* Activity Feed */}
          <Skeleton className="h-48 rounded-xl" />

          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function AISkeleton() {
  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 p-4 border-b border-border">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="w-32 h-5 mb-1" />
            <Skeleton className="w-24 h-3" />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={i % 2 === 0 ? 'flex gap-3' : 'flex gap-3 justify-end'}>
              {i % 2 === 0 && <Skeleton className="w-8 h-8 rounded-full" />}
              <Skeleton className="w-64 h-20 rounded-xl" />
              {i % 2 !== 0 && <Skeleton className="w-8 h-8 rounded-full" />}
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <Skeleton className="w-full h-12 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

function OnboardingSkeleton() {
  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-3xl space-y-8">
          {/* Header */}
          <div className="text-center">
            <Skeleton className="w-64 h-8 mx-auto mb-3" />
            <Skeleton className="w-96 h-5 mx-auto" />
          </div>

          {/* Role Selection */}
          <div className="flex justify-center gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="w-32 h-10 rounded-lg" />
            ))}
          </div>

          {/* Search */}
          <Skeleton className="w-full max-w-md mx-auto h-10 rounded-lg" />

          {/* Channel Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Skeleton className="w-32 h-10 rounded-lg" />
            <Skeleton className="w-32 h-10 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}

function NotFoundSkeleton() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center space-y-4">
        <Skeleton className="w-24 h-24 mx-auto rounded-full" />
        <Skeleton className="w-48 h-6 mx-auto" />
        <Skeleton className="w-64 h-4 mx-auto" />
        <Skeleton className="w-32 h-10 mx-auto rounded-lg" />
      </div>
    </div>
  )
}

function DefaultSkeleton() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="w-8 h-8 rounded" />
        <Skeleton className="w-32 h-4" />
      </div>
    </div>
  )
}

export { QASkeleton, FlashcardsSkeleton, ExamSkeleton, VoiceSkeleton, CodingSkeleton }
