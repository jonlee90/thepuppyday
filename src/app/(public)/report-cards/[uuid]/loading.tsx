/**
 * Loading State for Report Card Page
 * Shown while the report card is being fetched
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F8EEE5]">
      {/* Hero Skeleton */}
      <div className="relative w-full h-[400px] lg:h-[600px] bg-gray-300 animate-pulse" />

      {/* Assessment Section Skeleton */}
      <section className="bg-[#F8EEE5] py-12 lg:py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Title Skeleton */}
          <div className="text-center mb-10">
            <div className="h-10 w-64 bg-gray-300 rounded-lg mx-auto mb-3 animate-pulse" />
            <div className="h-6 w-48 bg-gray-200 rounded-lg mx-auto animate-pulse" />
          </div>

          {/* Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-xl shadow-sm animate-pulse"
              >
                <div className="w-12 h-12 bg-gray-300 rounded-lg mb-4" />
                <div className="h-4 w-20 bg-gray-200 rounded mb-2" />
                <div className="h-8 w-32 bg-gray-300 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content Skeleton */}
      <section className="bg-white py-12 lg:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-4">
            <div className="h-6 bg-gray-300 rounded w-full animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-5/6 animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-4/6 animate-pulse" />
          </div>
        </div>
      </section>
    </div>
  );
}
