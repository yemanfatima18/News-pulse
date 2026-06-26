"use client";


import React, { useState, useRef } from "react";
import { RefreshCw, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { triggerIngest, fetchJobStatus } from "../lib/api";

interface Props {
  onComplete: () => void;
}

type State = "idle" | "triggering" | "polling" | "done" | "error";

export default function RefreshButton({ onComplete }: Props) {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  async function handleRefresh() {
    if (state === "triggering" || state === "polling") return;

    setState("triggering");
    setMessage("Starting pipeline…");

    let jobId: string;
    try {
      jobId = await triggerIngest();
    } catch {
      setState("error");
      setMessage("Could not reach the backend API.");
      return;
    }

    setState("polling");
    setMessage("Fetching articles… this takes a minute or two.");

    pollRef.current = setInterval(async () => {
      try {
        const job = await fetchJobStatus(jobId);

        if (job.status === "done") {
          stopPolling();
          setState("done");
          setMessage("Done! Timeline updated.");
          onComplete();
          // Reset to idle after 4 seconds
          setTimeout(() => setState("idle"), 4000);
        } else if (job.status === "error") {
          stopPolling();
          setState("error");
          setMessage(`Pipeline error: ${job.error?.slice(0, 120) ?? "unknown"}`);
        }
      } catch {
        // Transient fetch error — keep polling
      }
    }, 3000);
  }

  const isRunning = state === "triggering" || state === "polling";

  const iconMap = {
    idle:       <RefreshCw size={14} />,
    triggering: <Loader size={14} className="animate-spin" />,
    polling:    <Loader size={14} className="animate-spin" />,
    done:       <CheckCircle size={14} />,
    error:      <AlertCircle size={14} />,
  };

  const colorMap = {
    idle:       "bg-indigo-600 hover:bg-indigo-700 text-white",
    triggering: "bg-indigo-400 cursor-not-allowed text-white",
    polling:    "bg-indigo-400 cursor-not-allowed text-white",
    done:       "bg-green-600 text-white",
    error:      "bg-red-600 text-white",
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={handleRefresh}
        disabled={isRunning}
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
          transition-colors ${colorMap[state]}
        `}
      >
        {iconMap[state]}
        {state === "idle" ? "Refresh Data" : "Refreshing…"}
      </button>

      {message && (
        <span
          className={`text-xs ${
            state === "error" ? "text-red-600" : "text-gray-500"
          }`}
        >
          {message}
        </span>
      )}
    </div>
  );
}
