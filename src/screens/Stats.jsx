import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getActivityStats, formatDuration, getTopicsWithSessions, getActivityLogs } from '../store';

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [topics, setTopics] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    setStats(getActivityStats());
    setTopics(getTopicsWithSessions());
    setLogs(getActivityLogs());
  }, []);

  if (!stats) return null;

  const reviewPercent = stats.totalTimeSeconds > 0
    ? Math.round((stats.reviewTimeSeconds / stats.totalTimeSeconds) * 100)
    : 0;

  const sessionPercent = stats.totalTimeSeconds > 0
    ? Math.round((stats.sessionTimeSeconds / stats.totalTimeSeconds) * 100)
    : 0;

  // Filter topics with time spent > 0
  const topicsWithTime = topics
    .filter((t) => t.totalTimeSeconds > 0)
    .sort((a, b) => b.totalTimeSeconds - a.totalTimeSeconds);

  return (
    <div className="w-full space-y-6 animate-fade-in max-w-3xl mx-auto py-2">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Learning Activity &amp; Statistics</h1>
          <p className="text-xs text-gray-400 mt-1">Detailed breakdown of time spent on card reviews and practice sessions.</p>
        </div>
        <Link
          to="/"
          className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg text-xs font-semibold border border-gray-700 transition-colors"
        >
          ← Dashboard
        </Link>
      </div>

      {/* Summary Stat Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-panel p-4 space-y-1">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Today's Time</div>
          <div className="text-2xl font-extrabold text-white">{formatDuration(stats.todayTimeSeconds)}</div>
        </div>
        <div className="glass-panel p-4 space-y-1">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Time</div>
          <div className="text-2xl font-extrabold text-purple-400">{formatDuration(stats.totalTimeSeconds)}</div>
        </div>
        <div className="glass-panel p-4 space-y-1">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Card Reviews</div>
          <div className="text-2xl font-extrabold text-emerald-400">{formatDuration(stats.reviewTimeSeconds)}</div>
        </div>
        <div className="glass-panel p-4 space-y-1">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Session Practice</div>
          <div className="text-2xl font-extrabold text-blue-400">{formatDuration(stats.sessionTimeSeconds)}</div>
        </div>
      </div>

      {/* Activity Type Breakdown */}
      <div className="glass-panel p-5 space-y-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Activity Type Distribution</h2>
        <div className="h-4 w-full bg-gray-800 rounded-full overflow-hidden flex border border-gray-700">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${reviewPercent}%` }}
            title={`Card Reviews: ${reviewPercent}%`}
          />
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${sessionPercent}%` }}
            title={`Session Practice: ${sessionPercent}%`}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 pt-1 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            <span>Card Reviews: <strong className="text-white">{reviewPercent}%</strong> ({formatDuration(stats.reviewTimeSeconds)})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
            <span>Session Practice: <strong className="text-white">{sessionPercent}%</strong> ({formatDuration(stats.sessionTimeSeconds)})</span>
          </div>
        </div>
      </div>

      {/* Topic Time Breakdown */}
      <div className="glass-panel p-5 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Time Spent per Topic</h2>
        {topicsWithTime.length > 0 ? (
          <div className="space-y-3">
            {topicsWithTime.map((topic) => {
              const maxTopicTime = topicsWithTime[0].totalTimeSeconds || 1;
              const barWidth = Math.round((topic.totalTimeSeconds / maxTopicTime) * 100);
              return (
                <div key={topic.id} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-200">{topic.title}</span>
                    <span className="text-purple-400 font-bold">{formatDuration(topic.totalTimeSeconds)}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, barWidth)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic">No topic time logged yet. Complete reviews or practice sessions to see your topic investment.</p>
        )}
      </div>

      {/* Recent Log History */}
      <div className="glass-panel p-5 space-y-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Recent Activity Logs</h2>
        {logs.length > 0 ? (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {logs.slice(0, 15).map((log) => {
              const date = new Date(log.createdAt);
              const isReview = log.type === 'review';
              return (
                <div key={log.id} className="flex justify-between items-center text-xs p-2.5 bg-[#11121d] rounded-lg border border-gray-800">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${isReview ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                      {log.type}
                    </span>
                    <span className="text-gray-400">
                      {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className="font-bold text-purple-300">{formatDuration(log.durationSeconds)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic">No activity logs recorded yet.</p>
        )}
      </div>
    </div>
  );
}
