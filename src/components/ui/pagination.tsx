export interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  currentCount: number
  pageSize?: number
  ariaLabel?: string
  onPageChange: (page: number) => void
}

function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  if (currentPage <= 3) {
    return [1, 2, 3, '...', totalPages]
  }
  if (currentPage >= totalPages - 2) {
    return [1, '...', totalPages - 2, totalPages - 1, totalPages]
  }
  return [1, '...', currentPage, '...', totalPages]
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  currentCount,
  pageSize = 10,
  ariaLabel = 'Table pagination',
  onPageChange,
}: PaginationProps) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const end = Math.min(start + currentCount - 1, totalItems)
  const rangeDisplay =
    totalItems === 0
      ? '0 of 0'
      : start === end
        ? `${start} of ${totalItems}`
        : `${start}-${end} of ${totalItems}`

  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 pt-1.5 text-xs text-text-email">
      <div>
        <span>{rangeDisplay}</span>
      </div>

      <nav aria-label={ariaLabel} className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-2 py-1 font-normal text-text-email transition-colors hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Previous
        </button>

        <span className="sm:hidden text-xs text-text-email">
          Page {currentPage} of {totalPages}
        </span>

        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers(currentPage, totalPages).map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-1 text-text-email select-none">
                  ...
                </span>
              )
            }

            const pageNum = Number(page)
            const isActive = currentPage === pageNum

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-brand-100 text-brand-700'
                    : 'text-text-email hover:bg-black/5 hover:text-foreground'
                }`}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-2 py-1 font-semibold text-primary transition-colors hover:text-brand-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Next
        </button>
      </nav>
    </footer>
  )
}
