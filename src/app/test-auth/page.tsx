'use client';

/**
 * Test page for debugging Supabase authentication
 */

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function TestAuthPage() {
  const [status, setStatus] = useState<string>('Ready to test');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const testConnection = async () => {
    setStatus('Testing connection...');
    setLogs([]);

    try {
      addLog('Creating Supabase client');
      const supabase = createClient();

      addLog('Testing basic query to users table');
      const { data, error } = await (supabase as any)
        .from('users')
        .select('id')
        .limit(1);

      if (error) {
        addLog(`Error querying users table: ${error.message}`);
        setStatus('Connection test failed');
      } else {
        addLog('Successfully connected to Supabase');
        addLog(`Query result: ${JSON.stringify(data)}`);
        setStatus('Connection successful');
      }
    } catch (err) {
      addLog(`Unexpected error: ${err}`);
      setStatus('Connection test failed');
    }
  };

  const testAuth = async () => {
    setStatus('Testing auth...');
    setLogs([]);

    try {
      addLog('Creating Supabase client');
      const supabase = createClient();

      addLog('Attempting to sign in with test credentials');
      addLog('Email: test@example.com, Password: testpassword');

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Auth timeout after 10 seconds')), 10000)
      );

      const authPromise = supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'testpassword',
      });

      addLog('Waiting for auth response...');

      const result = await Promise.race([authPromise, timeoutPromise]) as any;

      addLog('Auth response received');

      if (result.error) {
        addLog(`Auth error: ${result.error.message} (code: ${result.error.status})`);
        setStatus('Auth test completed with error (expected for invalid credentials)');
      } else if (result.data) {
        addLog('Auth successful (unexpected for test credentials)');
        addLog(`User: ${JSON.stringify(result.data.user)}`);
        setStatus('Auth test completed successfully');
      }
    } catch (err: any) {
      addLog(`Unexpected error: ${err.message}`);
      setStatus('Auth test failed');
    }
  };

  const checkEnv = () => {
    setStatus('Checking environment');
    setLogs([]);

    addLog(`NEXT_PUBLIC_USE_MOCKS: ${process.env.NEXT_PUBLIC_USE_MOCKS}`);
    addLog(`NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}`);
    addLog(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET (length: ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length + ')' : 'NOT SET'}`);

    setStatus('Environment check complete');
  };

  return (
    <div className="min-h-screen bg-[#F8EEE5] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#434E54] mb-8">
          Supabase Auth Test Page
        </h1>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-[#434E54] mb-4">
            Test Actions
          </h2>

          <div className="flex gap-4 mb-4">
            <button
              onClick={checkEnv}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Check Environment
            </button>

            <button
              onClick={testConnection}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Test Connection
            </button>

            <button
              onClick={testAuth}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              Test Auth
            </button>
          </div>

          <div className="p-4 bg-gray-100 rounded-lg">
            <p className="font-semibold">Status: {status}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-[#434E54] mb-4">
            Logs
          </h2>

          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p>No logs yet. Click a test button to start.</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
