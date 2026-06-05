export function ProductCardSkeleton() {
  return (
    <div className="glass rounded-2xl overflow-hidden border border-white/5">
      <div className="h-52 shimmer" />
      <div className="p-5 space-y-4">
        <div>
          <div className="h-5 w-3/4 shimmer rounded-lg mb-2" />
          <div className="h-3 w-full shimmer rounded-lg mb-1" />
          <div className="h-3 w-2/3 shimmer rounded-lg" />
        </div>
        <div className="h-4 w-1/2 shimmer rounded-lg" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 shimmer rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
