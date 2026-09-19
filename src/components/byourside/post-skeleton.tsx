export function PostCardSkeleton() {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-soft sm:p-6">
      <div className="flex items-center gap-3">
        <div className="skeleton size-11 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3 w-32 rounded-full" />
          <div className="skeleton h-2.5 w-20 rounded-full" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="skeleton h-3 w-full rounded-full" />
        <div className="skeleton h-3 w-[92%] rounded-full" />
        <div className="skeleton h-3 w-[75%] rounded-full" />
      </div>
      <div className="mt-4 grid gap-3">
        <div className="skeleton h-16 rounded-2xl" />
        <div className="skeleton h-16 rounded-2xl" />
      </div>
    </div>
  );
}
