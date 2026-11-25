import { useState, useCallback } from 'react'
import { useSearchParams } from 'react-router'
import { CheckCircle2, Cpu, Layers } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/ui/page-header'
import { StatsGrid } from '@/components/ui/stats-grid'
import { FilterToolbar } from '@/components/ui/filter-toolbar'
import { Pagination } from '@/components/ui/pagination'
import { type DropdownOption } from '@/components/ui/custom-dropdown'
import { CompostBatchesTable } from './compost-batches-table'
import { CompostBatchInfoModal } from './compost-batch-info-modal'
import { useBatches, useBatchStats } from '@/hooks/use-batches'
import { fetchBatches, type Batch } from '@/api/batch.api'
import { type BatchPhase } from '@/types/batch'
import { exportBatchesReport } from '@/lib/export-batches-report'
import { exportBatchesToSheets } from '@/lib/export-sheets'

const BATCH_STATUS_OPTIONS: DropdownOption[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'Cooling', label: 'Cooling' },
  { value: 'Thermophilic', label: 'Thermophilic' },
  { value: 'Mesophilic', label: 'Mesophilic' },
  { value: 'Completed', label: 'Completed' },
]

export function CompostBatchesPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const searchParam = searchParams.get('search') || ''
  const statusParam = searchParams.get('status') || 'all'
  const dateRangeParam = searchParams.get('dateRange') || 'all'
  const pageParam = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = 8

  const updateParams = useCallback(
    (newParams: Record<string, string | number | null>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        Object.entries(newParams).forEach(([key, val]) => {
          if (val === null || val === '' || val === 'all') {
            next.delete(key)
          } else {
            next.set(key, String(val))
          }
        })
        return next
      })
    },
    [setSearchParams]
  )

  const {
    data: batchData,
    isLoading,
    isError,
    refetch,
  } = useBatches({
    search: searchParam,
    status: statusParam as 'all' | BatchPhase,
    dateRange: dateRangeParam,
    page: pageParam,
    pageSize,
  })

  const { data: statsData } = useBatchStats()

  const batches = batchData?.data ?? []
  const totalItems = batchData?.total ?? 0
  const totalPages = batchData?.totalPages ?? 1

  const stats = statsData ?? {
    allTimeTotalProduced: '0 kg',
    totalCompostBatches: 0,
    finishedBatches: 0,
    ongoingBatches: 0,
  }

  const [isExporting, setIsExporting] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false)

  const handleExportPdf = async () => {
    try {
      setIsExporting(true)
      const res = await fetchBatches({
        search: searchParam,
        status: statusParam as 'all' | BatchPhase,
        dateRange: dateRangeParam,
        page: 1,
        pageSize: 1000,
      })
      exportBatchesReport({
        batches: res.data.length > 0 ? res.data : batches,
        search: searchParam,
        status: statusParam,
        dateRange: dateRangeParam,
      })
      toast.success('Compost batches report opened in new tab')
    } catch {
      exportBatchesReport({
        batches,
        search: searchParam,
        status: statusParam,
        dateRange: dateRangeParam,
      })
      toast.success('Compost batches report opened in new tab')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportSheets = async () => {
    try {
      setIsExporting(true)
      const res = await fetchBatches({
        search: searchParam,
        status: statusParam as 'all' | BatchPhase,
        dateRange: dateRangeParam,
        page: 1,
        pageSize: 1000,
      })
      exportBatchesToSheets(res.data.length > 0 ? res.data : batches)
      toast.success('Compost batches exported as Sheets (CSV)')
    } catch {
      exportBatchesToSheets(batches)
      toast.success('Compost batches exported as Sheets (CSV)')
    } finally {
      setIsExporting(false)
    }
  }

  const handleClearFilters = () => {
    updateParams({
      search: null,
      status: null,
      dateRange: null,
      page: 1,
    })
  }

  const handleViewBatch = (batch: Batch) => {
    setSelectedBatch(batch)
    setIsBatchModalOpen(true)
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <PageHeader title="Compost Batches" />

      <StatsGrid
        ariaLabel="Compost Batches Statistics"
        columnsClassName="grid-cols-2 xl:grid-cols-4"
        isLoading={isLoading}
        cards={[
          {
            label: 'All Time Total Produced',
            value: (
              <span>
                {String(stats.allTimeTotalProduced).replace(' kg', '')}
                <span className="ml-1 text-sm font-semibold">kg</span>
              </span>
            ),
            icon: Layers,
          },
          { label: 'Total Compost Batches', value: stats.totalCompostBatches, icon: Layers },
          { label: 'Finished batches', value: stats.finishedBatches, icon: CheckCircle2 },
          { label: 'Ongoing Batches', value: stats.ongoingBatches, icon: Cpu },
        ]}
      />

      <section
        aria-label="Compost batches directory"
        className="flex flex-col gap-3.5 rounded-[20px] bg-white px-4 sm:px-5 pt-4.5 pb-2.5 shadow-card w-full overflow-hidden"
      >
        <FilterToolbar
          search={searchParam}
          onSearchChange={(val) => updateParams({ search: val, page: 1 })}
          searchId="batch-search"
          searchLabel="Search a batch ID, status, or feedstock weight"
          searchPlaceholder="Search a batch ID, status, or feedstock weight.."
          status={statusParam}
          onStatusChange={(val) => updateParams({ status: val, page: 1 })}
          statusOptions={BATCH_STATUS_OPTIONS}
          statusId="batch-status-select"
          statusAriaLabel="Filter by batch status"
          dateRange={dateRangeParam}
          onDateRangeChange={(val) => updateParams({ dateRange: val, page: 1 })}
          dateId="batch-date-select"
          dateAriaLabel="Filter by date"
          onExportPdf={handleExportPdf}
          onExportSheets={handleExportSheets}
          isExporting={isExporting}
        />

        <div className="mt-5">
          <CompostBatchesTable
            batches={batches}
            isLoading={isLoading}
            error={isError ? 'Failed to load compost batches. Please try again.' : null}
            onRetry={() => void refetch()}
            onClearFilters={handleClearFilters}
            onView={handleViewBatch}
          />
        </div>

        <Pagination
          currentPage={pageParam}
          totalPages={totalPages}
          totalItems={totalItems}
          currentCount={batches.length}
          pageSize={pageSize}
          ariaLabel="Compost batches pagination"
          onPageChange={(page) => updateParams({ page })}
        />
      </section>

      <CompostBatchInfoModal
        isOpen={isBatchModalOpen}
        batch={selectedBatch}
        onClose={() => {
          setIsBatchModalOpen(false)
          setSelectedBatch(null)
        }}
      />
    </div>
  )
}

export default CompostBatchesPage
