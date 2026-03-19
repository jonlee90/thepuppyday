import { NextResponse } from 'next/server';
import { config } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  const mem = process.memoryUsage();
  const health: Record<string, unknown> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    mock_mode: String(config.useMocks),
    version: process.env.npm_package_version ?? '0.1.0',
    memory: {
      rss_mb: Math.round(mem.rss / 1024 / 1024),
      heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024),
      external_mb: Math.round(mem.external / 1024 / 1024),
    },
  };

  // Check Supabase connectivity if not in mock mode
  if (!config.useMocks && config.supabase.url) {
    try {
      const res = await fetch(`${config.supabase.url}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          apikey: config.supabase.anonKey,
        },
        signal: AbortSignal.timeout(5000),
      });
      health.supabase = res.ok ? 'connected' : 'error';
    } catch {
      health.supabase = 'unreachable';
      health.status = 'degraded';
    }
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  return NextResponse.json(health, { status: statusCode });
}
