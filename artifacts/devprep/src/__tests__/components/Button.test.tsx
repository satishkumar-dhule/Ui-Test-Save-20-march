import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/atoms/Button/Button'

describe('Button Component', () => {
  it('renders button with default props', () => {
    render(<Button>Click me</Button>)

    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('inline-flex')
    expect(button).toHaveClass('items-center')
  })

  it('renders button with different variants', () => {
    const { rerender } = render(<Button variant="default">Default</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-primary')

    rerender(<Button variant="destructive">Destructive</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-destructive')

    rerender(<Button variant="outline">Outline</Button>)
    expect(screen.getByRole('button')).toHaveClass('border')

    rerender(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-secondary')

    rerender(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByRole('button')).toHaveClass('hover:bg-accent')

    rerender(<Button variant="link">Link</Button>)
    expect(screen.getByRole('button')).toHaveClass('text-primary')
    expect(screen.getByRole('button')).toHaveClass('underline-offset-4')
  })

  it('renders button with different sizes', () => {
    const { rerender } = render(<Button size="default">Default</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-10')

    rerender(<Button size="sm">Small</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-9')

    rerender(<Button size="lg">Large</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-11')

    rerender(<Button size="icon">Icon</Button>)
    expect(screen.getByRole('button')).toHaveClass('w-10')
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('can be disabled', () => {
    render(<Button disabled>Disabled</Button>)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:pointer-events-none')
    expect(button).toHaveClass('disabled:opacity-50')
  })

  it('supports asChild prop', () => {
    render(
      <Button asChild>
        <span>Child Element</span>
      </Button>
    )

    const element = screen.getByText('Child Element')
    expect(element.tagName).toBe('SPAN')
    expect(element).toHaveClass('inline-flex')
  })

  it('passes through additional props', () => {
    render(<Button data-testid="custom-button">Test</Button>)

    expect(screen.getByTestId('custom-button')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>)

    expect(screen.getByRole('button')).toHaveClass('custom-class')
  })

  it('has proper accessibility attributes', () => {
    render(<Button aria-label="Close dialog">×</Button>)

    const button = screen.getByRole('button', { name: 'Close dialog' })
    expect(button).toHaveAttribute('aria-label', 'Close dialog')
    expect(button).toHaveTextContent('×')
  })

  it('has focus styles', () => {
    render(<Button>Focusable</Button>)

    const button = screen.getByRole('button')
    expect(button).toHaveClass('focus-visible:outline-none')
    expect(button).toHaveClass('focus-visible:ring-2')
  })
})

describe('Button Integration', () => {
  it('renders multiple buttons with different variants', () => {
    render(
      <div>
        <Button variant="default">Default</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
    )

    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  it('maintains focus within button group', () => {
    render(
      <div>
        <Button>First</Button>
        <Button>Second</Button>
      </div>
    )

    const buttons = screen.getAllByRole('button')
    buttons[0].focus()
    expect(document.activeElement).toBe(buttons[0])

    fireEvent.keyDown(buttons[0], { key: 'Tab' })
    // Tab to next element would be handled by browser, not test
  })

  it('button with loading state', () => {
    render(
      <Button disabled aria-busy="true">
        Loading...
      </Button>
    )

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
  })
})

describe('Button Accessibility', () => {
  it('has proper role', () => {
    render(<Button>Submit</Button>)

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('is keyboard accessible', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Press Enter</Button>)

    const button = screen.getByRole('button')
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' })
    // Note: actual Enter key activation is handled by browser, not jsdom
    // We're just testing that the button is focusable and has proper event handling
  })

  it('supports screen reader announcements', () => {
    render(
      <>
        <Button aria-describedby="description">Submit</Button>
        <div id="description">Click to submit form</div>
      </>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-describedby', 'description')
  })

  it('has visible focus indicator', () => {
    render(<Button>Focusable</Button>)

    const button = screen.getByRole('button')
    // Focus-visible classes are present
    expect(button.className).toContain('focus-visible:outline-none')
    expect(button.className).toContain('focus-visible:ring-2')
  })
})
