'use client'

import { syncGmailJobs } from './actions';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SyncGmailButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSync = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await syncGmailJobs();
      // Immediately refresh to ensure latest data is shown
      await router.refresh();
      setSuccess(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Sync Gmail error:', err);
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSync}>
        <button 
          type="submit" 
          disabled={isLoading}
          className={`
            border px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2 h-full
            ${isLoading 
              ? 'bg-gray-100 text-gray-600 border-gray-200 cursor-not-allowed opacity-60' 
              : success
              ? 'bg-green-50 hover:bg-green-100 text-green-600 border-green-200'
              : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'
            }
          `}
        >
          {isLoading ? '⏳ Syncing...' : success ? '✅ Synced!' : 'Sync Gmail 📧'}
        </button>
      </form>
      {error && (
        <div className="text-red-600 text-xs bg-red-50 p-2 rounded border border-red-200">
          ❌ {error}
        </div>
      )}
      {success && (
        <div className="text-green-600 text-xs bg-green-50 p-2 rounded border border-green-200">
          ✅ Gmail synced successfully! Check the console for details.
        </div>
      )}
    </div>
  );
}
