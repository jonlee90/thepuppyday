/**
 * Loading skeleton for marketing homepage
 */

export default function MarketingLoading() {
  return (
    <>
      {/* Hero Skeleton */}
      <section className="relative min-h-screen flex items-center justify-center bg-base-200 animate-pulse">
        <div className="container mx-auto px-4 text-center">
          <div className="h-16 bg-base-300 rounded-lg w-3/4 mx-auto mb-6" />
          <div className="h-8 bg-base-300 rounded-lg w-1/2 mx-auto mb-10" />
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="h-12 bg-base-300 rounded-full w-48 mx-auto" />
            <div className="h-12 bg-base-300 rounded-full w-48 mx-auto" />
          </div>
        </div>
      </section>

      {/* Services Skeleton */}
      <section className="py-16 md:py-24 bg-base-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="h-10 bg-base-300 rounded-lg w-64 mx-auto mb-4 animate-pulse" />
            <div className="h-6 bg-base-300 rounded-lg w-96 mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card bg-base-200 shadow-xl animate-pulse">
                <div className="card-body">
                  <div className="w-16 h-16 bg-base-300 rounded-full mx-auto mb-4" />
                  <div className="h-6 bg-base-300 rounded w-3/4 mx-auto mb-2" />
                  <div className="h-4 bg-base-300 rounded w-full mb-2" />
                  <div className="h-4 bg-base-300 rounded w-5/6 mx-auto mb-4" />
                  <div className="h-8 bg-base-300 rounded w-24 mx-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After Skeleton */}
      <section className="py-16 md:py-24 bg-base-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="h-10 bg-base-300 rounded-lg w-80 mx-auto mb-4 animate-pulse" />
            <div className="h-6 bg-base-300 rounded-lg w-96 mx-auto animate-pulse" />
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="w-full h-96 md:h-[500px] bg-base-300 rounded-lg animate-pulse" />
          </div>
        </div>
      </section>

      {/* Gallery Skeleton */}
      <section className="py-16 md:py-24 bg-base-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="h-10 bg-base-300 rounded-lg w-48 mx-auto mb-4 animate-pulse" />
            <div className="h-6 bg-base-300 rounded-lg w-96 mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="aspect-square bg-base-300 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Contact Skeleton */}
      <section className="py-16 md:py-24 bg-base-200">
        <div className="container mx-auto px-4">
          <div className="h-10 bg-base-300 rounded-lg w-64 mx-auto mb-12 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-base-300 rounded-full animate-pulse" />
                  <div className="flex-1">
                    <div className="h-5 bg-base-300 rounded w-24 mb-2 animate-pulse" />
                    <div className="h-4 bg-base-300 rounded w-36 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="h-6 bg-base-300 rounded w-48 mb-6 animate-pulse" />
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="h-12 bg-base-300 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
