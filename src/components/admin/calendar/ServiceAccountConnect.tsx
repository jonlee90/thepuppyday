'use client';

import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ServiceAccountConnectProps {
  onConnect: (credentials: string, calendarId: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  isConnecting?: boolean;
}

export function ServiceAccountConnect({
  onConnect,
  isConnecting = false,
}: ServiceAccountConnectProps) {
  const [credentials, setCredentials] = useState('');
  const [calendarId, setCalendarId] = useState('primary');
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setError('Please upload a JSON file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        // Validate it's valid JSON
        JSON.parse(content);
        setCredentials(content);
        setError(null);
      } catch {
        setError('Invalid JSON file. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleConnect = async () => {
    setError(null);

    // Validate credentials
    if (!credentials.trim()) {
      setError('Please provide service account credentials');
      return;
    }

    if (!calendarId.trim()) {
      setError('Please provide a calendar ID');
      return;
    }

    // Validate JSON format
    try {
      const parsed = JSON.parse(credentials);
      if (parsed.type !== 'service_account') {
        setError('Invalid service account file. Expected type: "service_account"');
        return;
      }
      if (!parsed.client_email || !parsed.private_key) {
        setError('Missing required fields: client_email or private_key');
        return;
      }
    } catch {
      setError('Invalid JSON format. Please check your credentials.');
      return;
    }

    // Call the onConnect handler
    const result = await onConnect(credentials, calendarId);

    if (!result.success) {
      setError(result.error || 'Failed to connect to Google Calendar');
    } else {
      // Clear form on success
      setCredentials('');
      setCalendarId('primary');
    }
  };

  return (
    <div className="space-y-6">
      {/* Setup Guide Toggle */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="flex items-center gap-2 text-blue-700 font-medium hover:text-blue-800 transition-colors w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <Info size={18} />
            <span>How to get Service Account credentials</span>
          </div>
          <motion.div
            animate={{ rotate: showGuide ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            ▼
          </motion.div>
        </button>

        <AnimatePresence>
          {showGuide && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-3 text-sm text-gray-700">
                <div>
                  <strong className="text-gray-900">Step 1:</strong> Go to{' '}
                  <a
                    href="https://console.cloud.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Google Cloud Console
                  </a>
                </div>
                <div>
                  <strong className="text-gray-900">Step 2:</strong> Create a new project or
                  select existing one
                </div>
                <div>
                  <strong className="text-gray-900">Step 3:</strong> Enable the Google Calendar
                  API (APIs & Services → Library → Search &quot;Google Calendar API&quot; → Enable)
                </div>
                <div>
                  <strong className="text-gray-900">Step 4:</strong> Create Service Account
                  (IAM & Admin → Service Accounts → Create Service Account)
                </div>
                <div>
                  <strong className="text-gray-900">Step 5:</strong> Enable Domain-Wide Delegation (IMPORTANT)
                  <ul className="list-disc list-inside ml-4 mt-1 text-xs">
                    <li>Click on the service account you created</li>
                    <li>Go to &quot;Advanced settings&quot; section</li>
                    <li>Check &quot;Enable Google Workspace Domain-wide Delegation&quot;</li>
                    <li>Click Save</li>
                  </ul>
                </div>
                <div>
                  <strong className="text-gray-900">Step 6:</strong> Create and download JSON key
                  (Actions → Manage keys → Add key → Create new key → JSON)
                </div>
                <div>
                  <strong className="text-gray-900">Step 7:</strong> Share your Google Calendar
                  with the service account email (found in the JSON file as{' '}
                  <code className="bg-gray-100 px-1 rounded">client_email</code>) and grant{' '}
                  <strong>&quot;Make changes to events&quot;</strong> permission
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded p-2 mt-2">
                  <strong className="text-amber-900">Common Errors:</strong>
                  <ul className="list-disc list-inside ml-2 mt-1 text-xs">
                    <li>&quot;Not Found&quot; → Calendar not shared with service account</li>
                    <li>&quot;Insufficient scopes&quot; → Domain-Wide Delegation not enabled</li>
                    <li>&quot;Permission denied&quot; → Shared calendar permissions too restrictive</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Calendar ID Input */}
      <div>
        <label htmlFor="calendar-id" className="block text-sm font-medium text-gray-700 mb-2">
          Calendar ID
        </label>
        <input
          type="text"
          id="calendar-id"
          value={calendarId}
          onChange={(e) => setCalendarId(e.target.value)}
          placeholder="primary"
          className="input input-bordered w-full"
          disabled={isConnecting}
        />
        <p className="text-xs text-gray-500 mt-1">
          Use &quot;primary&quot; for your main calendar, or find the specific calendar ID in
          Google Calendar settings
        </p>
      </div>

      {/* Credentials Upload/Paste */}
      <div>
        <label htmlFor="credentials" className="block text-sm font-medium text-gray-700 mb-2">
          Service Account Credentials (JSON)
        </label>

        {/* File Upload Button */}
        <div className="mb-3">
          <label
            htmlFor="file-upload"
            className="btn btn-sm btn-outline gap-2 cursor-pointer"
          >
            <Upload size={16} />
            Upload JSON File
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".json,application/json"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isConnecting}
          />
        </div>

        {/* Textarea for pasting */}
        <textarea
          id="credentials"
          value={credentials}
          onChange={(e) => {
            setCredentials(e.target.value);
            setError(null);
          }}
          placeholder='Paste your service account JSON here or upload a file above...'
          rows={12}
          className="textarea textarea-bordered w-full font-mono text-xs"
          disabled={isConnecting}
        />
        <p className="text-xs text-gray-500 mt-1">
          Your credentials are encrypted and stored securely in the database.
        </p>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
          >
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-700">{error}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connect Button */}
      <button
        onClick={handleConnect}
        disabled={isConnecting || !credentials.trim() || !calendarId.trim()}
        className="btn btn-primary w-full gap-2"
      >
        {isConnecting ? (
          <>
            <span className="loading loading-spinner loading-sm" />
            Connecting...
          </>
        ) : (
          <>
            <CheckCircle2 size={18} />
            Connect Google Calendar
          </>
        )}
      </button>
    </div>
  );
}
