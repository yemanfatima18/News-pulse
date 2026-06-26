"use client";



import React from "react";

const SOURCES = ["All Sources", "BBC News", "NPR", "The Guardian"];

interface Props {
  active: string;
  onChange: (source: string) => void;
}

export default function SourceFilter({ active, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-gray-500 font-medium mr-1">Filter:</span>
      {SOURCES.map((src) => (
        <button
          key={src}
          onClick={() => onChange(src)}
          className={`
            px-3 py-1.5 rounded-full text-xs font-medium transition-all
            ${active === src
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }
          `}
        >
          {src}
        </button>
      ))}
    </div>
  );
}
