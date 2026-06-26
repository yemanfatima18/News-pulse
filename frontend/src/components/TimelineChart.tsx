"use client";



import React, { useMemo, useState } from "react";
import { TimelineItem } from "../lib/api";

interface Props {
  items: TimelineItem[];
  onClusterClick: (clusterId: string) => void;
}


const BAR_COLORS = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981",
  "#3b82f6", "#ef4444", "#8b5cf6", "#14b8a6",
];

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function TimelineChart({ items, onClusterClick }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; item: TimelineItem } | null>(null);

  
  const validItems = useMemo(
    () => items.filter((i) => i.start_ms !== null && i.end_ms !== null),
    [items]
  );

  if (validItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No timeline data yet. Hit "Refresh Data" to pull fresh articles.
      </div>
    );
  }

  
  const globalStart = Math.min(...validItems.map((i) => i.start_ms!));
  const globalEnd = Math.max(...validItems.map((i) => i.end_ms!));
  const timeRange = globalEnd - globalStart || 1;

  
  const SVG_WIDTH = 900;
  const LEFT_MARGIN = 180;   
  const RIGHT_MARGIN = 20;
  const CHART_WIDTH = SVG_WIDTH - LEFT_MARGIN - RIGHT_MARGIN;
  const ROW_HEIGHT = 36;
  const BAR_HEIGHT_BASE = 12;
  const SVG_HEIGHT = validItems.length * ROW_HEIGHT + 60; 

  function xForMs(ms: number): number {
    return LEFT_MARGIN + ((ms - globalStart) / timeRange) * CHART_WIDTH;
  }

  
  const ticks = Array.from({ length: 5 }, (_, i) => {
    const ms = globalStart + (i / 4) * timeRange;
    return { ms, x: xForMs(ms) };
  });

  return (
    <div className="relative overflow-x-auto">
      <svg
        width={SVG_WIDTH}
        height={SVG_HEIGHT}
        className="font-sans"
        style={{ maxWidth: "100%" }}
      >
        {/* Time axis */}
        <line
          x1={LEFT_MARGIN}
          y1={SVG_HEIGHT - 40}
          x2={SVG_WIDTH - RIGHT_MARGIN}
          y2={SVG_HEIGHT - 40}
          stroke="#e5e7eb"
          strokeWidth={1}
        />
        {ticks.map(({ ms, x }) => (
          <g key={ms}>
            <line
              x1={x} y1={SVG_HEIGHT - 45}
              x2={x} y2={SVG_HEIGHT - 35}
              stroke="#9ca3af"
              strokeWidth={1}
            />
            <text
              x={x}
              y={SVG_HEIGHT - 20}
              textAnchor="middle"
              fontSize={10}
              fill="#9ca3af"
            >
              {formatDateShort(ms)}
            </text>
          </g>
        ))}

        {/* Vertical grid lines */}
        {ticks.map(({ ms, x }) => (
          <line
            key={`grid-${ms}`}
            x1={x} y1={0}
            x2={x} y2={SVG_HEIGHT - 40}
            stroke="#f3f4f6"
            strokeWidth={1}
          />
        ))}

        {/* Cluster bars */}
        {validItems.map((item, idx) => {
          const x1 = xForMs(item.start_ms!);
          const x2 = xForMs(item.end_ms!);
          
          const barW = Math.max(x2 - x1, 6);
          const barH = BAR_HEIGHT_BASE + (item.size - 1) * 3;
          const y = idx * ROW_HEIGHT + (ROW_HEIGHT - barH) / 2;
          const color = BAR_COLORS[idx % BAR_COLORS.length];
          const isHovered = hoveredId === item.cluster_id;

          
          const labelText =
            item.label.length > 26
              ? item.label.slice(0, 25) + "…"
              : item.label;

          return (
            <g key={item.cluster_id}>
              {/* Label on the left */}
              <text
                x={LEFT_MARGIN - 8}
                y={idx * ROW_HEIGHT + ROW_HEIGHT / 2 + 4}
                textAnchor="end"
                fontSize={11}
                fill={isHovered ? color : "#374151"}
                fontWeight={isHovered ? 600 : 400}
              >
                {labelText}
              </text>

              {/* The timeline bar */}
              <rect
                x={x1}
                y={y}
                width={barW}
                height={barH}
                rx={3}
                fill={color}
                opacity={isHovered ? 1 : 0.75}
                style={{ cursor: "pointer", transition: "opacity 0.15s" }}
                onMouseEnter={(e) => {
                  setHoveredId(item.cluster_id);
                  setTooltip({
                    x: e.clientX,
                    y: e.clientY,
                    item,
                  });
                }}
                onMouseLeave={() => {
                  setHoveredId(null);
                  setTooltip(null);
                }}
                onClick={() => onClusterClick(item.cluster_id)}
              />

              {/* Article count badge */}
              {barW > 24 && (
                <text
                  x={x1 + barW / 2}
                  y={y + barH / 2 + 4}
                  textAnchor="middle"
                  fontSize={9}
                  fill="white"
                  fontWeight={700}
                  style={{ pointerEvents: "none" }}
                >
                  {item.article_count}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl pointer-events-none"
          style={{ left: tooltip.x + 12, top: tooltip.y - 60, maxWidth: 240 }}
        >
          <p className="font-semibold mb-1">{tooltip.item.label}</p>
          <p className="text-gray-300">{tooltip.item.article_count} articles</p>
          {tooltip.item.earliest_at && (
            <p className="text-gray-400 mt-1 text-[10px]">
              {formatDate(tooltip.item.start_ms!)} →{" "}
              {formatDate(tooltip.item.end_ms!)}
            </p>
          )}
          <p className="text-indigo-300 mt-1 text-[10px]">Click to view articles</p>
        </div>
      )}
    </div>
  );
}
