import {
  SpatialContainer,
  SpatialCard,
  SpatialGrid,
  SpatialStack,
  SpatialPageLayout,
  SpatialCardGrid,
  SpatialDepth,
  SpatialLayer,
} from '@/components/app/SpatialLayout'
import { GlassCard } from '@/components/ui/glass-card'

/**
 * Demo component showing Apple Glass Theme spatial layout improvements
 * Demonstrates depth, layering, and spatial computing inspired layouts
 */
export function SpatialLayoutDemo() {
  return (
    <SpatialPageLayout variant="default" padding="lg">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page Header with Depth */}
        <SpatialContainer variant="glass" size="lg" depth={3}>
          <h1 className="text-3xl font-bold text-foreground mb-2">Spatial Layout System</h1>
          <p className="text-muted-foreground">
            Apple Glass Theme Migration - Depth, layering, and spatial computing inspired layouts
          </p>
        </SpatialContainer>

        {/* Depth Levels Demo */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Depth Levels</h2>
          <SpatialGrid columns={{ default: 1, sm: 2, md: 3, lg: 5 }} gap="md">
            {[1, 2, 3, 4, 5].map(depth => (
              <SpatialDepth key={depth} depth={depth as 1 | 2 | 3 | 4 | 5}>
                <div className="p-4 bg-card rounded-xl">
                  <div className="font-medium text-foreground">Depth {depth}</div>
                  <div className="text-sm text-muted-foreground">Shadow layer {depth}</div>
                </div>
              </SpatialDepth>
            ))}
          </SpatialGrid>
        </section>

        {/* Card Variants Demo */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Card Variants</h2>
          <SpatialGrid columns={{ default: 1, sm: 2, lg: 4 }} gap="lg">
            <SpatialCard variant="default" size="md">
              <h3 className="font-semibold text-foreground mb-2">Default Card</h3>
              <p className="text-sm text-muted-foreground">
                Standard spatial card with depth and rounded corners
              </p>
            </SpatialCard>

            <SpatialCard variant="glass" size="md">
              <h3 className="font-semibold text-foreground mb-2">Glass Card</h3>
              <p className="text-sm text-muted-foreground">
                Frosted glass effect with backdrop blur
              </p>
            </SpatialCard>

            <SpatialCard variant="glass-primary" size="md">
              <h3 className="font-semibold text-foreground mb-2">Primary Glass</h3>
              <p className="text-sm text-muted-foreground">Primary color accent glass effect</p>
            </SpatialCard>

            <SpatialCard variant="glass-secondary" size="md">
              <h3 className="font-semibold text-foreground mb-2">Secondary Glass</h3>
              <p className="text-sm text-muted-foreground">Secondary color accent glass effect</p>
            </SpatialCard>
          </SpatialGrid>
        </section>

        {/* Spatial Grid Layouts */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Spatial Grid Layouts</h2>

          <div className="grid-spatial">
            {Array.from({ length: 6 }).map((_, i) => (
              <SpatialCard key={i} variant="glass" size="md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-semibold">{i + 1}</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">Card {i + 1}</h3>
                    <p className="text-sm text-muted-foreground">Auto-fit responsive grid</p>
                  </div>
                </div>
              </SpatialCard>
            ))}
          </div>
        </section>

        {/* Layering Demo */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Spatial Layering</h2>
          <div className="relative h-64 bg-muted/20 rounded-xl p-6">
            <SpatialLayer layer={1} className="absolute top-4 left-4">
              <div className="p-3 bg-background/80 rounded-lg border">Layer 1 (Base)</div>
            </SpatialLayer>

            <SpatialLayer layer={2} className="absolute top-16 left-16">
              <div className="p-3 bg-background/90 rounded-lg border">Layer 2 (Elevated)</div>
            </SpatialLayer>

            <SpatialLayer layer={3} className="absolute top-28 left-28">
              <div className="p-3 bg-background rounded-lg border">Layer 3 (Modal)</div>
            </SpatialLayer>
          </div>
        </section>

        {/* Container Sizes */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Container Sizes</h2>
          <SpatialStack direction="horizontal" gap="md" wrap>
            <SpatialContainer variant="glass" size="sm">
              <span className="text-sm">Small (8px/16px)</span>
            </SpatialContainer>

            <SpatialContainer variant="glass" size="md">
              <span className="text-sm">Medium (16px/24px)</span>
            </SpatialContainer>

            <SpatialContainer variant="glass" size="lg">
              <span className="text-sm">Large (24px/32px)</span>
            </SpatialContainer>

            <SpatialContainer variant="glass" size="xl">
              <span className="text-sm">Extra Large (32px/48px)</span>
            </SpatialContainer>
          </SpatialStack>
        </section>

        {/* Glass Effects */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Glass Effects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard variant="default" hoverEffect="scale" animate={false}>
              <div className="p-6">
                <h3 className="font-semibold text-foreground mb-2">Glass Card Component</h3>
                <p className="text-sm text-muted-foreground">
                  Using the existing GlassCard component with Apple glass morphism
                </p>
              </div>
            </GlassCard>

            <SpatialCard variant="glass" size="lg" className="p-6">
              <h3 className="font-semibold text-foreground mb-2">Spatial Glass Card</h3>
              <p className="text-sm text-muted-foreground">
                New spatial layout system with integrated glass effects
              </p>
            </SpatialCard>
          </div>
        </section>
      </div>
    </SpatialPageLayout>
  )
}
