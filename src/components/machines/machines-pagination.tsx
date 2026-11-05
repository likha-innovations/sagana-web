interface MachinesPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  currentCount: number
  onPageChange: (page: number) => void
}

export function MachinesPagination({
  currentPage,
  totalPages,
  totalItems,
  currentCount,
  onPageChange,
}: MachinesPaginationProps) {
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

  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 pt-1.5 text-[12px] text-[#7C7D74]">
      <div>
        <span>
          {totalItems > 0 ? `${currentCount} of ${totalItems}` : '0 of 0'}
        </span>
      </div>

      <nav aria-label="Machines table pagination" className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-2 py-1 font-normal text-[#7C7D74] transition-colors hover:text-[#414141] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Previous
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-1 text-[#7C7D74] select-none"
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
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#E5ECC4] text-[#566811]'
                    : 'text-[#7C7D74] hover:bg-black/5 hover:text-[#414141]'
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
          className="px-2 py-1 font-semibold text-[#718619] transition-colors hover:text-[#566811] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Next
        </button>
      </nav>
    </footer>
  )
}
