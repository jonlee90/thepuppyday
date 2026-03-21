'use client';

/**
 * Root-level Error Boundary (global-error.tsx)
 *
 * Catches errors that escape the layout-level error.tsx boundary,
 * including root layout rendering failures. Must provide its own
 * <html> and <body> tags since it replaces the entire document.
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            background: 'linear-gradient(to bottom, #FFFBF7, #F8EEE5, #FFFBF7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div style={{ maxWidth: '28rem', width: '100%', textAlign: 'center' }}>
            <div
              style={{
                width: '5rem',
                height: '5rem',
                borderRadius: '50%',
                background: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                fontSize: '2rem',
              }}
            >
              !
            </div>

            <div
              style={{
                background: 'white',
                borderRadius: '0.75rem',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                padding: '2rem',
              }}
            >
              <h1 style={{ color: '#434E54', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                Something went wrong
              </h1>

              <p style={{ color: 'rgba(67,78,84,0.7)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                We&apos;re sorry, but something unexpected happened. Please try again.
              </p>

              {error.digest && (
                <div
                  style={{
                    background: '#F8EEE5',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  <p style={{ fontSize: '0.75rem', color: 'rgba(67,78,84,0.6)', margin: '0 0 0.25rem' }}>
                    Error Reference:
                  </p>
                  <code style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: '#434E54' }}>
                    {error.digest}
                  </code>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={reset}
                  style={{
                    background: '#434E54',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.625rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Try Again
                </button>

                <a
                  href="/"
                  style={{
                    display: 'inline-block',
                    border: '1px solid rgba(67,78,84,0.3)',
                    borderRadius: '0.5rem',
                    padding: '0.625rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#434E54',
                    textDecoration: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Go to Homepage
                </a>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
