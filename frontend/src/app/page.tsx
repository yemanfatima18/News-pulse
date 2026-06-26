"use client";



import React, { useCallback, useEffect, useState } from "react";
import { Rss, LayoutList } from "lucide-react";
import {
  fetchTimeline,
  fetchClusterDetail,
  fetchClusters,
  TimelineItem,
  ClusterDetail as ClusterDetailType,
  ClusterSummary,
} from "../lib/api";
import TimelineChart from "../components/TimelineChart";
import ClusterDetail from "../components/ClusterDetail";
import SourceFilter from "../components/SourceFilter";
import RefreshButton from "../components/RefreshButton";

export default function HomePage() {
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [clusters, setClusters] = useState<ClusterSummary[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<ClusterDetailType | null>(null);
  const [activeSource, setActiveSource] = useState("All Sources");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load timeline + cluster list
  const loadData = useCallback(async (source?: string) => {
    setLoading(true);
    setError(null);
    try {
      const [tl, cl] = await Promise.all([
        fetchTimeline(source && source !== "All Sources" ? source : undefined),
        fetchClusters(),
      ]);
      setTimeline(tl);
      setClusters(cl);
    } catch (err) {
      setError("Could not load data. Is the backend running?");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleClusterClick(clusterId: string) {
    try {
      const detail = await fetchClusterDetail(clusterId);
      setSelectedCluster(detail);
    } catch {
      console.error("Could not load cluster detail");
    }
  }

  function handleSourceChange(source: string) {
    setActiveSource(source);
    loadData(source === "All Sources" ? undefined : source);
  }

  // Quick stats from the cluster list
  const totalArticles = clusters.reduce((sum, c) => sum + c.article_count, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ---- Header ---- */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
              <Rss size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-none">News Pulse</h1>
              <p className="text-xs text-gray-400 mt-0.5">Topic-clustered news timeline</p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <SourceFilter active={activeSource} onChange={handleSourceChange} />
            <RefreshButton onComplete={() => loadData(activeSource === "All Sources" ? undefined : activeSource)} />
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-8">
        {/* ---- Stats row ---- */}
        {!loading && !error && (
          <div className="flex gap-6 mb-8">
            <StatCard label="Topic Clusters" value={clusters.length} icon="🗂️" />
            <StatCard label="Total Articles" value={totalArticles} icon="📰" />
            <StatCard label="Sources" value={3} icon="🌐" />
          </div>
        )}

        {/* ---- Error state ---- */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-red-700 text-sm">
            <strong className="block mb-1">Something went wrong</strong>
            {error}
            <button
              onClick={() => loadData()}
              className="mt-3 text-xs underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* ---- Loading skeleton ---- */}
        {loading && (
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="h-64 bg-gray-100 rounded-2xl" />
          </div>
        )}

        {/* ---- Timeline ---- */}
        {!loading && !error && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <LayoutList size={16} className="text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Timeline
              </h2>
              {timeline.length > 0 && (
                <span className="ml-auto text-xs text-gray-400">
                  Click a bar to view articles
                </span>
              )}
            </div>

            <TimelineChart items={timeline} onClusterClick={handleClusterClick} />
          </section>
        )}

        {/* ---- Cluster list ---- */}
        {!loading && !error && clusters.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              All Clusters
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {clusters.map((c) => (
                <button
                  key={c.cluster_id}
                  onClick={() => handleClusterClick(c.cluster_id)}
                  className="text-left bg-white rounded-xl border border-gray-100 p-4 hover:border-indigo-300 hover:shadow-md transition-all group"
                >
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-indigo-700 line-clamp-2 leading-snug">
                    {c.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {c.article_count} article{c.article_count !== 1 ? "s" : ""}
                  </p>
                  {c.latest_at && (
                    <p className="text-xs text-gray-300 mt-0.5">
                      Latest:{" "}
                      {new Date(c.latest_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ---- Cluster detail panel ---- */}
      {selectedCluster && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-30 backdrop-blur-sm"
            onClick={() => setSelectedCluster(null)}
          />
          <ClusterDetail
            cluster={selectedCluster}
            onClose={() => setSelectedCluster(null)}
          />
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center gap-3 shadow-sm">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-xl font-bold text-gray-900">{value.toLocaleString()}</p>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
    </div>
  );
}
