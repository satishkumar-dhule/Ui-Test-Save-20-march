# Layout System

## Overview

The DevPrep layout system provides responsive, accessible, and consistent layout primitives built on top of Tailwind CSS and Apple Glass Theme tokens.

## Components

### Container

- **Purpose**: Responsive content container with configurable max-width and padding.
- **Variants**: `size` (sm, md, lg, xl, 2xl, full), `padding` (none, sm, md, lg, xl).
- **Props**: `centered`, `fluid`.
- **Breakpoints**: Uses Tailwind's `max-w-screen-*` classes.

### Grid

- **Purpose**: Responsive grid layouts with configurable columns and gaps.
- **Features**: Fixed columns at breakpoints, auto-fit responsive grid.
- **Props**: `columns` (object with breakpoints), `gap`, `autoFit`, `minItemWidth`.

### Stack

- **Purpose**: Flexible stacking (vertical/horizontal) with consistent spacing.
- **Props**: `direction`, `gap`, `wrap`, `align`, `justify`.

### Spacer

- **Purpose**: Empty space element for layout spacing.
- **Props**: `size`, `axis`.

## Spacing Scale

Based on Apple Glass Theme tokens:

| Token | Value   | Pixels |
| ----- | ------- | ------ |
| xs    | 0.25rem | 4px    |
| sm    | 0.5rem  | 8px    |
| md    | 1rem    | 16px   |
| lg    | 1.5rem  | 24px   |
| xl    | 2rem    | 32px   |
| 2xl   | 3rem    | 48px   |
| 3xl   | 4rem    | 64px   |
| 4xl   | 6rem    | 96px   |
| 5xl   | 8rem    | 128px  |

## Responsive Breakpoints

| Breakpoint | Min Width | Notes            |
| ---------- | --------- | ---------------- |
| sm         | 640px     | Mobile landscape |
| md         | 768px     | Tablet           |
| lg         | 1024px    | Desktop          |
| xl         | 1280px    | Large desktop    |
| 2xl        | 1536px    | Extra large      |

## Usage Examples

```tsx
import { Container, Grid, Stack, Spacer } from '@/components/layout'

// Responsive container with padding
;<Container size="lg" padding="md" centered>
  <Stack direction="column" gap="lg">
    <Grid columns={{ default: 1, md: 2, lg: 3 }} gap="md">
      <div>Item 1</div>
      <div>Item 2</div>
      <div>Item 3</div>
    </Grid>
  </Stack>
</Container>
```

## Integration with Existing System

- Leverages existing CSS variables from `layout.css`.
- Compatible with Apple Glass Theme depth and spatial utilities.
- Works alongside existing `ResponsiveContainer` and `SpatialLayout` components.

## Accessibility

- All layout components maintain proper semantic HTML.
- Reduced motion support via CSS media query.
- High contrast mode support.
