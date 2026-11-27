export interface PageHeaderProps {
  title: string
}

export function PageHeader({ title }: PageHeaderProps) {
  return (
    <header className="flex h-auto min-h-9.75 flex-wrap items-center justify-between gap-4">
      <h1 className="text-2xl sm:text-[29px] font-semibold leading-[140%] text-foreground">
        {title}
      </h1>
    </header>
  )
}
