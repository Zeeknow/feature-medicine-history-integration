import React, { useState, useEffect } from 'react';

/**
 * MedicineHistory Component
 * Fetches and displays the immutable blockchain audit trail for a medicine batch.
 */
const MedicineHistory = ({ medicineId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    if (!medicineId) return;

    setLoading(true);
    setError(null);

    try {
      // Calling the updated API endpoint in the backend
      const response = await fetch(`http://localhost:5001/api/medicines/${medicineId}/history`);
      const data = await response.json();

      if (response.ok && data.success) {
        setHistory(data.history);
      } else {
        throw new Error(data.error || "Failed to retrieve history from blockchain.");
      }
    } catch (err) {
      console.error("History UI Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch history when the component mounts or ID changes
  useEffect(() => {
    fetchHistory();
  }, [medicineId]);

  return (
    <div className="mt-8 bg-white shadow sm:rounded-lg border border-gray-200">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
          <span className="mr-2">🛡️</span> Blockchain Audit Trail
        </h3>
        <button 
          onClick={fetchHistory}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
          disabled={loading}
        >
          {loading ? "Syncing..." : "Refresh"}
        </button>
      </div>

      <div className="px-4 py-5 sm:p-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-4">
            <div className="text-sm text-red-700 font-medium">Error: {error}</div>
          </div>
        )}

        {history.length === 0 && !loading ? (
          <p className="text-sm text-gray-500 italic">No historical records found for this ID.</p>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {history.map((event, eventIdx) => (
                <li key={eventIdx}>
                  <div className="relative pb-8">
                    {eventIdx !== history.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                          <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-900 font-bold uppercase tracking-tight">
                            {event.action} <span className="ml-2 font-normal text-xs text-green-600 border border-green-200 bg-green-50 px-1 rounded">On-Chain</span>
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500 font-mono">Actor: {event.participant}</p>
                          {event.note && (
                            <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded italic border-l-2 border-gray-300">
                              "{event.note}"
                            </p>
                          )}
                        </div>
                        <div className="text-right text-xs whitespace-nowrap text-gray-400">
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicineHistory;