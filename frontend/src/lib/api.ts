import { API_BASE } from "./constants";
import type {
  QueryRequest,
  QueryResponse,
  SummarizeRequest,
  SummarizeResponse,
} from "@/types";

export class QueryError extends Error {
  sql: string;
  constructor(message: string, sql = "") {
    super(message);
    this.name = "QueryError";
    this.sql = sql;
  }
}

async function request<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new QueryError(
      "Server nicht erreichbar. Bitte prüfe ob der Backend-Service läuft."
    );
  }

  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    const message =
      typeof detail?.detail === "string"
        ? detail.detail
        : detail?.detail?.error ?? `Request failed (${res.status})`;
    const sql = detail?.detail?.sql ?? "";
    throw new QueryError(message, sql);
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
