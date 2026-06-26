"use client";


import React from "react";
import { X, ExternalLink, Clock, Globe } from "lucide-react";
import { ClusterDetail as ClusterDetailType } from "../lib/api";

interface Props {
  cluster: ClusterDetailType | null;
  onClose: () => void;
}

const SOURCE_COLORS: Record<string, string> = {
  "BBC News":    "bg-red-100 text-red-700",
  "NPR":         "bg-blue-100 text-blue-700",
  "The Guardian":"bg-green-100 text-green-700",
};

function formatPublished(ts: string | null): string {
  if (!ts) return "Date unknown";
  const d = new Date(ts);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ClusterDetail({ cluster, onClose }: Props) {
  if (!cluster) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-gray-100 bg-gray-50">
        <div className="pr-4">
          <p className="text-xs uppercase tracking-widest text-gray-400 font-medium mb-1">
            Topic Cluster
          </p>
          <h2 className="text-lg font-semibold text-gray-900 leading-tight">
            {cluster.label}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {cluster.article_count} article{cluster.article_count !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-700 shrink-0"
          aria-label="Close panel"
        >
          <X size={18} />
        </button>
      </div>

      {/* Article list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cluster.articles.map((article) => {
          const tagClass =
            SOURCE_COLORS[article.source] || "bg-gray-100 text-gray-600";

          return (
            <article
              key={article.id}
              className="rounded-xl border border-gray-100 p-4 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all"
            >
              {/* Source + timestamp row */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${tagClass}`}
                >
                  <Globe size={10} className="inline mr-1 -mt-0.5" />
                  {article.source}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock size={10} />
                  {formatPublished(article.published_at)}
                </span>
              </div>

              {/* Headline */}
              <h3 className="text-sm font-semibold text-gray-800 leading-snug mb-1">
                {article.headline}
              </h3>

              {/* Summary */}
              {article.summary && (
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                  {article.summary.slice(0, 200)}
                  {article.summary.length > 200 ? "…" : ""}
                </p>
              )}

              {/* Read full article link */}
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                Read full article
                <ExternalLink size={11} />
              </a>
            </article>
          );
        })}
      </div>
    </div>
  );
}
