export interface HealthResponse {
  status: string;
  cluster_name: string;
}

export interface TestIndexResponse {
  result: string;
  id: string;
}

export interface SearchHitSource {
  transcript_text: string;
  speaker: string;
  meeting_title: string;
  meeting_date: string;
  timestamp_start: string;
}

export interface SearchHit {
  id: string;
  score: number | null;
  source: SearchHitSource;
}

export interface SearchResponse {
  total: number;
  hits: SearchHit[];
}

export interface BulkIngestResponse {
  indexed: number;
  errors: number | unknown[];
}

export interface SearchFilters {
  speaker?: string;
  meeting_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface SearchRequest {
  query: string;
  filters?: SearchFilters;
  size?: number;
  use_reranking?: boolean;
}

export interface ApiResult<T> {
  ok: boolean;
  data: T | null;
  error: string | null;
}
