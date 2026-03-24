import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ColumnDef<T> {
  id: string
  header: string
  accessor: keyof T | ((row: T) => React.ReactNode)
  width?: string | number
  sortable?: boolean
  filterable?: boolean
  cell?: (value: unknown, row: T) => React.ReactNode
}

export interface PaginationConfig {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  pageSizeOptions?: number[]
  onPageSizeChange?: (size: number) => void
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  selectable?: boolean
  sortable?: boolean
  filterable?: boolean
  pagination?: PaginationConfig
  emptyState?: React.ReactNode
  loading?: boolean
  onRowClick?: (row: T) => void
  onSelectionChange?: (selectedRows: T[]) => void
  className?: string
  keyField: keyof T
}

type SortDirection = 'asc' | 'desc' | null

export function DataTable<T>({
  columns,
  data,
  selectable = false,
  sortable = false,
  filterable = false,
  pagination,
  emptyState,
  loading = false,
  onRowClick,
  onSelectionChange,
  className,
  keyField,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = React.useState<string | null>(null)
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null)
  const [selectedRows, setSelectedRows] = React.useState<Set<unknown>>(new Set())
  const [filters, setFilters] = React.useState<Record<string, string>>({})

  const handleSort = (columnId: string) => {
    if (!sortable) return
    if (sortColumn === columnId) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'))
      if (sortDirection === 'desc') {
        setSortColumn(null)
      }
    } else {
      setSortColumn(columnId)
      setSortDirection('asc')
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allKeys = new Set(data.map(row => row[keyField] as unknown))
      setSelectedRows(allKeys)
      onSelectionChange?.(data)
    } else {
      setSelectedRows(new Set())
      onSelectionChange?.([])
    }
  }

  const handleSelectRow = (key: unknown, checked: boolean, row: T) => {
    const newSelected = new Set(selectedRows)
    if (checked) {
      newSelected.add(key)
    } else {
      newSelected.delete(key)
    }
    setSelectedRows(newSelected)
    const selectedData = data.filter(r => newSelected.has(r[keyField] as unknown))
    onSelectionChange?.(selectedData)
  }

  const processedData = React.useMemo(() => {
    let result = [...data]

    if (sortColumn && sortDirection) {
      result.sort((a, b) => {
        const col = columns.find(c => c.id === sortColumn)
        if (!col) return 0
        const aVal =
          typeof col.accessor === 'function' ? col.accessor(a) : a[col.accessor as keyof T]
        const bVal =
          typeof col.accessor === 'function' ? col.accessor(b) : b[col.accessor as keyof T]
        if (aVal === bVal) return 0
        const cmp = aVal! < bVal! ? -1 : 1
        return sortDirection === 'asc' ? cmp : -cmp
      })
    }

    return result
  }, [data, sortColumn, sortDirection, columns])

  const paginatedData = React.useMemo(() => {
    if (!pagination) return processedData
    const start = (pagination.page - 1) * pagination.pageSize
    return processedData.slice(start, start + pagination.pageSize)
  }, [processedData, pagination])

  const renderCell = (column: ColumnDef<T>, row: T): React.ReactNode => {
    const value: unknown =
      typeof column.accessor === 'function' ? column.accessor(row) : row[column.accessor as keyof T]
    if (column.cell) {
      return column.cell(value, row)
    }
    return String(value ?? '')
  }

  if (loading) {
    return (
      <div
        className={cn(
          'w-full overflow-x-auto bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-xl',
          className
        )}
      >
        <div className="animate-pulse">
          <div className="h-12 bg-[var(--surface-secondary)] border-b border-[var(--border-primary)]" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 border-b border-[var(--border-secondary)]" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'w-full overflow-x-auto bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-xl',
        className
      )}
    >
      <table className="w-full text-sm" role="grid">
        <thead className="bg-[var(--surface-secondary)] border-b border-[var(--border-primary)]">
          <tr>
            {selectable && (
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedRows.size === data.length && data.length > 0}
                  onChange={e => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--border-primary)]"
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map(column => (
              <th
                key={column.id}
                className={cn(
                  'px-4 py-3 text-left font-semibold text-[var(--text-primary)] whitespace-nowrap',
                  sortable &&
                    column.sortable &&
                    'cursor-pointer select-none hover:bg-[var(--surface-hover)]'
                )}
                style={{ width: column.width }}
                onClick={() => sortable && column.sortable && handleSort(column.id)}
                aria-sort={
                  sortColumn === column.id
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
                role="columnheader"
              >
                <span className="flex items-center gap-1">
                  {column.header}
                  {sortable && column.sortable && sortColumn === column.id && (
                    <span className="text-[var(--brand-primary)]">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="px-4 py-12 text-center text-[var(--text-tertiary)]"
              >
                {emptyState || 'No data available'}
              </td>
            </tr>
          ) : (
            paginatedData.map(row => {
              const rowKey = row[keyField] as unknown
              const isSelected = selectedRows.has(rowKey)

              return (
                <tr
                  key={String(rowKey)}
                  className={cn(
                    'border-b border-[var(--border-secondary)] transition-colors duration-150',
                    'hover:bg-[var(--surface-secondary)]',
                    onRowClick && 'cursor-pointer',
                    isSelected && 'bg-[var(--brand-primary-subtle)]'
                  )}
                  onClick={() => onRowClick?.(row)}
                  role="row"
                  aria-selected={isSelected}
                >
                  {selectable && (
                    <td className="w-12 px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={e => handleSelectRow(rowKey, e.target.checked, row)}
                        className="w-4 h-4 rounded border-[var(--border-primary)]"
                        aria-label={`Select row ${row[keyField]}`}
                      />
                    </td>
                  )}
                  {columns.map(column => (
                    <td
                      key={column.id}
                      className="px-4 py-3 text-[var(--text-primary)]"
                      role="gridcell"
                    >
                      {renderCell(column, row)}
                    </td>
                  ))}
                </tr>
              )
            })
          )}
        </tbody>
      </table>

      {pagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-primary)] bg-[var(--surface-secondary)]">
          <div className="text-sm text-[var(--text-secondary)]">
            Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                'border border-[var(--border-primary)]',
                pagination.page === 1
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-[var(--surface-hover)]'
              )}
              aria-label="Previous page"
            >
              Previous
            </button>
            <span className="text-sm text-[var(--text-secondary)]">
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                'border border-[var(--border-primary)]',
                pagination.page >= Math.ceil(pagination.total / pagination.pageSize)
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-[var(--surface-hover)]'
              )}
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable
