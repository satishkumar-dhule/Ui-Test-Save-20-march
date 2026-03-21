'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  GlassButton,
  GlassBadge,
} from '@/components/ui/glass'
import { staggerContainer, staggerItem } from '@/styles/animations'

export function GlassAnimationDemo() {
  return (
    <div className="p-8 space-y-8">
      <h2 className="text-2xl font-bold mb-6">Glass Animation Examples</h2>

      {/* Glass Card Variants */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">Card Variants</h3>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <motion.div variants={staggerItem}>
            <GlassCard variant="default" hoverEffect="scale" className="p-6">
              <GlassCardHeader>
                <GlassCardTitle>Scale Hover</GlassCardTitle>
                <GlassCardDescription>Subtle scale effect on hover</GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                <p className="text-sm">Hover over this card to see the scale animation.</p>
              </GlassCardContent>
            </GlassCard>
          </motion.div>

          <motion.div variants={staggerItem}>
            <GlassCard variant="primary" hoverEffect="lift" className="p-6">
              <GlassCardHeader>
                <GlassCardTitle>Lift Hover</GlassCardTitle>
                <GlassCardDescription>Card lifts on hover</GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                <p className="text-sm">This card lifts up when you hover.</p>
              </GlassCardContent>
            </GlassCard>
          </motion.div>

          <motion.div variants={staggerItem}>
            <GlassCard variant="secondary" hoverEffect="glow" className="p-6">
              <GlassCardHeader>
                <GlassCardTitle>Glow Hover</GlassCardTitle>
                <GlassCardDescription>Glowing effect on hover</GlassCardDescription>
              </GlassCardHeader>
              <GlassCardContent>
                <p className="text-sm">Watch the glow effect on hover.</p>
              </GlassCardContent>
            </GlassCard>
          </motion.div>
        </motion.div>
      </section>

      {/* Buttons */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">Glass Buttons</h3>
        <div className="flex flex-wrap gap-4">
          <GlassButton variant="default">Default Button</GlassButton>
          <GlassButton variant="outline">Outline Button</GlassButton>
          <GlassButton variant="ghost">Ghost Button</GlassButton>
          <GlassButton size="lg">Large Button</GlassButton>
          <GlassButton size="sm">Small Button</GlassButton>
        </div>
      </section>

      {/* Badges */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">Glass Badges</h3>
        <div className="flex flex-wrap gap-4">
          <GlassBadge>Default Badge</GlassBadge>
          <GlassBadge variant="secondary">Secondary</GlassBadge>
          <GlassBadge variant="outline">Outline</GlassBadge>
        </div>
      </section>

      {/* Loading States */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">Loading Animations</h3>
        <div className="flex flex-wrap gap-8 items-center">
          <div className="glass-loading-shimmer w-48 h-24 rounded-xl"></div>
          <div className="glass-spinner"></div>
          <div className="glass-skeleton w-32 h-8 rounded"></div>
        </div>
      </section>

      {/* Animation Classes Demo */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">CSS Animation Classes</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass glass-fade-in-up p-4 rounded-xl text-center">Fade In Up</div>
          <div className="glass glass-fade-in-scale p-4 rounded-xl text-center">Fade In Scale</div>
          <div className="glass glass-slide-in-left p-4 rounded-xl text-center">Slide In Left</div>
          <div className="glass glass-slide-in-right p-4 rounded-xl text-center">
            Slide In Right
          </div>
        </div>
      </section>

      {/* Staggered Animation */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">Staggered Animation</h3>
        <div className="glass-stagger flex flex-wrap gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="glass glass-card-sm">
              Item {i}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
