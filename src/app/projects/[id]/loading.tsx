export default function ProjectLoading() {
  return (
    <div className="animate-pulse">
      {/* Hero skeleton */}
      <div
        className="px-4 md:px-6 lg:px-8 pt-5 pb-0"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="h-3 w-32 rounded-full mb-5" style={{ background: 'var(--surface-2)' }} />
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl shrink-0" style={{ background: 'var(--surface-2)' }} />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-48 rounded-lg" style={{ background: 'var(--surface-2)' }} />
            <div className="h-3 w-72 rounded-full" style={{ background: 'var(--surface-2)' }} />
          </div>
        </div>
        <div className="h-2 w-full rounded-full mb-6" style={{ background: 'var(--surface-2)' }} />
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 w-16 rounded-full" style={{ background: 'var(--surface-2)' }} />
          ))}
        </div>
      </div>
      {/* Content skeleton */}
      <div className="p-4 md:p-6 lg:p-8 space-y-4">
        <div className="h-32 rounded-2xl" style={{ background: 'var(--surface-2)' }} />
        <div className="h-48 rounded-2xl" style={{ background: 'var(--surface-2)' }} />
      </div>
    </div>
  )
}
