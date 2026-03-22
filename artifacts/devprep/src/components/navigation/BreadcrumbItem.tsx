import React from 'react'
import { Link } from 'wouter'
import { cn } from '@/lib/utils'

export interface BreadcrumbItemProps {
  label: string
  path: string
  isCurrent?: boolean
  className?: string
  children?: React.ReactNode
  onClick?: () => void
}

/**
 * BreadcrumbItem - Individual breadcrumb item with link or current page indicator
 * 
 * @example
 * <BreadcrumbItem label="Settings" path="/settings" />
 * <BreadcrumbItem label="Profile" path="/settings/profile" isCurrent />
 */
export function BreadcrumbItem({
  label,
  path,
  isCurrent = false,
  className,
  children,
  onClick,
}: BreadcrumbItemProps) {
  if (isCurrent) {
    return (
      <li className={cn('inline-flex items-center gap-1.5', className)}>
        <span
          role="link"
          aria-disabled="true"
          aria-current="page"
          className="font-normal text-foreground"
        >
          {children || label}
        </span>
      </li>
    )
  }

  return (
    <li className={cn('inline-flex items-center gap-1.5', className)}>
      <Link
        href={path}
        className="transition-colors hover:text-foreground"
        aria-label={`Navigate to ${label}`}
        onClick={onClick}
      >
        {children || label}
      </Link>
    </li>
  )
}

/**
 * BreadcrumbSeparator - Visual separator between breadcrumb items
 */
export function BreadcrumbSeparator({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLLIElement> & {
  children?: React.ReactNode
}) {
  return (
    <li
      role="presentation"
      aria-hidden="true"
      className={cn('[&>svg]:w-3.5 [&>svg]:h-3.5', className)}
      {...props}
    >
      {children || (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-chevron-right"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      )}
    </li>
  )
}

/**
 * BreadcrumbEllipsis - Collapsed breadcrumb indicator
 */
export function BreadcrumbEllipsis({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      role="presentation"
      aria-hidden="true"
      className={cn('flex h-9 w-9 items-center justify-center', className)}
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-more-horizontal"
      >
        <line x1="2" x2="22" y1="12" y2="12" />
        <line x1="2" x2="22" y1="6" y2="6" />
        <line x1="2" x2="22" y1="18" y2="18" />
      </svg>
      <span className="sr-only">More</span>
    </span>
  )
}