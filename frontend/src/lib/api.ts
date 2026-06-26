
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";



export interface ClusterSummary {
  cluster_id: string;
  label: string;
  article_count: number;
  earliest_at: string | null;
  latest_at: string | null;
}

export interface Article {
  id: string;
  source: string;
  url: string;
  headline: string;
  summary: string;
  published_at: string | null;
}

export interface ClusterDetail extends ClusterSummary {
  articles: Article[];
}

export interface TimelineItem {
  cluster_id: string;
  label: string;
  article_count: number;
  earliest_at: string | null;
  latest_at: string | null;
  start_ms: number | null;
  end_ms: number | null;
  size: number; // 1–5
}

export interface IngestJob {
  jobId: string;
  status: "running" | "done" | "error";
  startedAt: string;
  finishedAt: string | null;
  error: string | null;
}



export async function fetchClusters(): Promise<ClusterSummary[]> {
  const res = await fetch(`${API_BASE}/clusters`);
  if (!res.ok) throw new Error(`/clusters returned ${res.status}`);
  const data = await res.json();
  return data.clusters;
}

export async function fetchClusterDetail(id: string): Promise<ClusterDetail> {
  const res = await fetch(`${API_BASE}/clusters/${id}`);
  if (!res.ok) throw new Error(`/clusters/${id} returned ${res.status}`);
  return res.json();
}

export async function fetchTimeline(source?: string): Promise<TimelineItem[]> {
  const url = source
    ? `${API_BASE}/timeline?source=${encodeURIComponent(source)}`
    : `${API_BASE}/timeline`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`/timeline returned ${res.status}`);
  const data = await res.json();
  return data.timeline;
}

export async function triggerIngest(): Promise<string> {
  const res = await fetch(`${API_BASE}/ingest/trigger`, { method: "POST" });
  if (!res.ok) throw new Error(`/ingest/trigger returned ${res.status}`);
  const data = await res.json();
  return data.jobId;
}

export async function fetchJobStatus(jobId: string): Promise<IngestJob> {
  const res = await fetch(`${API_BASE}/ingest/status/${jobId}`);
  if (!res.ok) throw new Error(`/ingest/status returned ${res.status}`);
  return res.json();
}
