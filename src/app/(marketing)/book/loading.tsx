/**
 * Loading state for booking page
 */

export default function BookingLoading() {
  return (
    <main className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-base-100 border-b border-base-300">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
          <div className="h-10 bg-base-300 rounded w-64 mx-auto animate-pulse" />
          <div className="h-4 bg-base-300 rounded w-96 mx-auto mt-4 animate-pulse" />
        </div>
      </div>

      {/* Wizard skeleton */}
      <div className="py-6 sm:py-10">
        <div className="max-w-7xl mx-auto px-4">
          {/* Progress skeleton */}
          <div className="mb-8">
            <div className="flex justify-center gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-base-300 animate-pulse" />
                  <div className="hidden sm:block w-16 h-4 bg-base-300 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-base-100 rounded-xl border border-base-300 p-6">
                <div className="h-8 bg-base-300 rounded w-1/3 animate-pulse mb-4" />
                <div className="h-4 bg-base-300 rounded w-2/3 animate-pulse mb-8" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-48 bg-base-300 rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Price summary skeleton */}
            <div className="hidden lg:block">
              <div className="bg-base-100 rounded-xl border border-base-300 p-6 sticky top-24">
                <div className="h-6 bg-base-300 rounded w-1/2 animate-pulse mb-6" />
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between">
                      <div className="h-4 bg-base-300 rounded w-1/3 animate-pulse" />
                      <div className="h-4 bg-base-300 rounded w-1/4 animate-pulse" />
                    </div>
                  ))}
                </div>
                <div className="border-t border-base-300 mt-6 pt-4">
                  <div className="flex justify-between">
                    <div className="h-5 bg-base-300 rounded w-1/4 animate-pulse" />
                    <div className="h-6 bg-base-300 rounded w-1/3 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
