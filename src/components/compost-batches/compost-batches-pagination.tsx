interface CompostBatchesPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  currentCount: number
  pageSize?: number
  onPageChange: (page: number) => void
}

export function CompostBatchesPagination({
  currentPage,
  totalPages,
  totalItems,
  currentCount,
  pageSize = 8,
  onPageChange,
}: CompostBatchesPaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', currentPage, '...', totalPages)
      }
    }
    return pages
  }

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

      <nav aria-label="Compost batches pagination" className="flex items-center gap-2">
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
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-1 text-text-email select-none"
                >
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
