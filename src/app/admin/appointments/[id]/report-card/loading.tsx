/**
 * Loading skeleton for Report Card page
 */

export default function ReportCardLoading() {
  return (
    <div className="min-h-screen bg-[#F8EEE5] py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-6">
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-5 w-64 bg-gray-200 rounded animate-pulse mb-1" />
          <div className="h-4 w-52 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Progress bar skeleton */}
        <div className="bg-white rounded-lg shadow-sm px-4 py-2.5 mb-6">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {/* Photos section skeleton */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="h-6 w-20 bg-gray-200 rounded animate-pulse mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-[200px] bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-[200px] bg-gray-100 rounded-lg animate-pulse" />
            </div>
          </div>

          {/* Assessment section skeleton */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="h-6 w-28 bg-gray-200 rounded animate-pulse mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-3" />
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="h-[72px] bg-gray-100 rounded-lg animate-pulse" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Health section skeleton */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="h-6 w-44 bg-gray-200 rounded animate-pulse mb-6" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>

          {/* Notes section skeleton */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-6" />
            <div className="h-36 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
