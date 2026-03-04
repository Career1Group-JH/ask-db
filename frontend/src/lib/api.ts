import { API_BASE } from "./constants";
import type {
  QueryRequest,
  QueryResponse,
  SummarizeRequest,
  SummarizeResponse,
} from "@/types";

async function request<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    const message =
      typeof detail?.detail === "string"
        ? detail.detail
        : detail?.detail?.error ?? `Request failed (${res.status})`;
    throw new Error(message);
  }

  return res.json();
}

export function postQuery(payload: QueryRequest): Promise<QueryResponse> {
  return request<QueryResponse>("/query", payload);
}

export function postSummarize(
  payload: SummarizeRequest
): Promise<SummarizeResponse> {
  return request<SummarizeResponse>("/summarize", payload);
}
