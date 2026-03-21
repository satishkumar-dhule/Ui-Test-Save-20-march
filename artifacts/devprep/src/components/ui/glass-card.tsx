'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { glassHover, fadeInUp } from '@/styles/animations'

interface GlassCardProps {
  variant?: 'default' | 'light' | 'dark' | 'subtle' | 'primary' | 'secondary'
  hoverEffect?: 'none' | 'scale' | 'lift' | 'glow' | 'pulse'
  animate?: boolean
  delay?: number
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      className,
      variant = 'default',
      hoverEffect = 'scale',
      animate = true,
      delay = 0,
      children,
      onClick,
    },
    ref
  ) => {
    const variantClasses = {
      default: 'glass',
      light: 'glass-light',
      dark: 'glass-dark',
      subtle: 'glass-subtle',
      primary: 'glass-primary',
      secondary: 'glass-secondary',
    }

    const hoverClasses = {
      none: '',
      scale: 'glass-hover-subtle',
      lift: 'glass-hover-lift',
      glow: 'glass-hover-glow',
      pulse: 'glass-hover-pulse',
    }

    if (!animate) {
      return (
        <div
          ref={ref}
          className={cn(
            variantClasses[variant],
            hoverClasses[hoverEffect],
            'glass-transition-all',
            className
          )}
          onClick={onClick}
        >
          {children}
        </div>
      )
    }

    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.3,
              delay,
              ease: [0.16, 1, 0.3, 1],
            },
          },
        }}
        whileHover="hover"
        whileTap="tap"
        className={cn(variantClasses[variant], 'glass-transition-all cursor-pointer', className)}
        onClick={onClick}
      >
        {children}
      </motion.div>
    )
  }
)

GlassCard.displayName = 'GlassCard'

// Glass Card Header
const GlassCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
)
GlassCardHeader.displayName = 'GlassCardHeader'

// Glass Card Title
const GlassCardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
)
GlassCardTitle.displayName = 'GlassCardTitle'

// Glass Card Description
const GlassCardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
)
GlassCardDescription.displayName = 'GlassCardDescription'

// Glass Card Content
const GlassCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
)
GlassCardContent.displayName = 'GlassCardContent'

// Glass Card Footer
const GlassCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
)
GlassCardFooter.displayName = 'GlassCardFooter'

// Glass Button Component
interface GlassButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    { className, variant = 'default', size = 'md', children, onClick, disabled, type = 'button' },
    ref
  ) => {
    const variantClasses = {
      default: 'glass-btn',
      outline: 'glass-btn glass-border',
      ghost: 'glass-btn glass-subtle',
    }

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    }

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          variantClasses[variant],
          sizeClasses[size],
          'glass-transition-all font-medium',
          className
        )}
        onClick={onClick}
        disabled={disabled}
        type={type}
      >
        {children}
      </motion.button>
    )
  }
)

GlassButton.displayName = 'GlassButton'

// Glass Badge Component
interface GlassBadgeProps {
  variant?: 'default' | 'secondary' | 'outline'
  children: React.ReactNode
  className?: string
}

const GlassBadge = React.forwardRef<HTMLDivElement, GlassBadgeProps>(
  ({ className, variant = 'default', children }, ref) => {
    const variantClasses = {
      default: 'glass-badge',
      secondary: 'glass-subtle rounded-full px-2 py-0.5 text-xs',
      outline: 'glass-border rounded-full px-2 py-0.5 text-xs',
    }

    return (
      <motion.div
        ref={ref}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        className={cn(variantClasses[variant], className)}
      >
        {children}
      </motion.div>
    )
  }
)

GlassBadge.displayName = 'GlassBadge'

export {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  GlassCardFooter,
  GlassButton,
  GlassBadge,
}
