import React from 'react';
import { PulseLoader } from 'react-spinners'; // For adding a spinner during loading

const Display = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center my-12">
        <PulseLoader color="#007bff" size={15} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center my-12">
        <span className="text-2xl text-zinc-300">No data available.</span>
      </div>
    );
  }

  const { user_info, average_score, average_comments, common_subreddits, common_flairs } = data;

  return (
    <div className="max-w-3xl mx-auto my-12 p-6 md:p-10 rounded-2xl shadow-xl bg-zinc-900 text-zinc-100 font-sans">
      <h2 className="text-3xl font-bold mb-8 tracking-tight">🔍 Reddit User Analysis</h2>

      {/* User Info */}
      <div className="mb-8 p-6 border border-zinc-700 rounded-xl bg-zinc-800/50 backdrop-blur-sm">
        <h3 className="text-xl font-semibold mb-4">👤 User Info</h3>
        <div className="space-y-2 text-zinc-300">
          {Object.entries(user_info).map(([key, value]) => (
            <p key={key}>
              <span className="font-medium text-zinc-200">{key}:</span> {String(value)}
            </p>
          ))}
        </div>
      </div>

      {/* Average Score & Comments */}
      <div className="mb-8 p-6 border border-zinc-700 rounded-xl bg-zinc-800/50 backdrop-blur-sm">
        <h3 className="text-xl font-semibold mb-4">📊 Average Metrics</h3>
        <div className="space-y-2 text-zinc-300">
          <p><span className="font-medium text-zinc-200">Average Score:</span> {average_score || 'N/A'}</p>
          <p><span className="font-medium text-zinc-200">Average Comments:</span> {average_comments || 'N/A'}</p>
        </div>
      </div>

      {/* Common Subreddits */}
      <div className="mb-8 p-6 border border-zinc-700 rounded-xl bg-zinc-800/50 backdrop-blur-sm">
        <h3 className="text-xl font-semibold mb-4">📌 Common Subreddits (Posted 10+ times)</h3>
        {Object.entries(common_subreddits).length === 0 ? (
          <p className="text-zinc-400">No common subreddits.</p>
        ) : (
          <ul className="list-disc list-inside space-y-1 text-zinc-300">
            {Object.entries(common_subreddits).map(([subreddit, count], idx) => (
              <li key={idx}>
                <span className="font-medium text-zinc-200">{subreddit}</span> - {count} times
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Common Flairs */}
      <div className="mb-8 p-6 border border-zinc-700 rounded-xl bg-zinc-800/50 backdrop-blur-sm">
        <h3 className="text-xl font-semibold mb-4">🏷️ Common Flairs (Used 10+ times)</h3>
        {Object.entries(common_flairs).length === 0 ? (
          <p className="text-zinc-400">No common flairs.</p>
        ) : (
          <ul className="list-disc list-inside space-y-1 text-zinc-300">
            {Object.entries(common_flairs).map(([flair, count], idx) => (
              <li key={idx}>
                <span className="font-medium text-zinc-200">{flair}</span> - {count} times
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Display;