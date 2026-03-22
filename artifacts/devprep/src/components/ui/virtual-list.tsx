import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { Channel } from '@/data/channels'
import type { Section } from '@/stores/contentStore'

interface VirtualListProps<T> {
  items: T[]
  height: number | string
  itemHeight: number
  overscan?: number
  children: (item: T, index: number) => React.ReactNode
  className?: string
}

export function VirtualList<T>({
  items,
  height,
  itemHeight,
  overscan = 3,
  children,
  className = '',
}: VirtualListProps<T>): React.ReactElement {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height)
      }
    })

    resizeObserver.observe(container)
    setContainerHeight(container.clientHeight)

    return () => resizeObserver.disconnect()
  }, [])

  const totalHeight = items.length * itemHeight

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  )

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return (
    <div
      ref={containerRef}
      className={`virtual-list-container ${className}`}
      style={{ height, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: startIndex * itemHeight,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => children(item, startIndex + index))}
        </div>
      </div>
    </div>
  )
}

interface VirtualGridProps<T> {
  items: T[]
  height: number | string
  columns: number
  gap?: number
  overscan?: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
}

export function VirtualGrid<T>({
  items,
  height,
  columns,
  gap = 0,
  overscan = 1,
  renderItem,
  className = '',
}: VirtualGridProps<T>): React.ReactElement {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height)
        setContainerWidth(entry.contentRect.width)
      }
    })

    resizeObserver.observe(container)
    setContainerHeight(container.clientHeight)
    setContainerWidth(container.clientWidth)

    return () => resizeObserver.disconnect()
  }, [])

  const itemWidth = useMemo(
    () => (containerWidth - gap * (columns - 1)) / columns,
    [containerWidth, columns, gap]
  )

  const rowHeight = itemWidth + gap
  const totalRows = Math.ceil(items.length / columns)
  const totalHeight = totalRows * rowHeight

  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const endRow = Math.min(
    totalRows,
    Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
  )

  const startIndex = startRow * columns
  const endIndex = Math.min(items.length, endRow * columns)

  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  )

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return (
    <div
      ref={containerRef}
      className={`virtual-grid-container ${className}`}
      style={{ height, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: totalHeight,
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, ${itemWidth}px)`,
          gap: `${gap}px`,
          position: 'relative',
        }}
      >
        {visibleItems.map((item, index) => (
          <div
            key={startIndex + index}
            style={{
              position: 'absolute',
              left: (index % columns) * (itemWidth + gap),
              top: Math.floor(index / columns) * rowHeight,
              width: itemWidth,
            }}
          >
            {renderItem(item, startIndex + index)}
          </div>
        ))}
      </div>
    </div>
  )
}

export function useVirtualList<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan = 3
): {
  virtualItems: { item: T; index: number; style: React.CSSProperties }[]
  totalHeight: number
  scrollToIndex: (index: number) => void
} {
  const [scrollTop, setScrollTop] = useState(0)
  const scrollToIndexRef = useRef<(index: number) => void>(undefined)

  const totalHeight = items.length * itemHeight

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const virtualItems = useMemo(() => {
    const result: { item: T; index: number; style: React.CSSProperties }[] = []
    for (let i = startIndex; i < endIndex; i++) {
      result.push({
        item: items[i],
        index: i,
        style: {
          position: 'absolute',
          top: i * itemHeight,
          left: 0,
          right: 0,
          height: itemHeight,
        },
      })
    }
    return result
  }, [items, startIndex, endIndex, itemHeight])

  const scrollToIndex = useCallback(
    (index: number) => {
      setScrollTop(index * itemHeight)
    },
    [itemHeight]
  )

  scrollToIndexRef.current = scrollToIndex

  return { virtualItems, totalHeight, scrollToIndex }
}
