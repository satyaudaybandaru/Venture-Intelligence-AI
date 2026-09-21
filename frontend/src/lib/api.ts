export const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
export type Item = {
  id: string;
  title: string;
  description: string;
  priority: number;
  status: string;
  created_at?: string;
  updated_at?: string;
};
export type Implementation = {
  id?: string;
  person_name: string;
  role: string;
  similarity: number;
  description: string;
  github?: string;
  demo?: string;
  portfolio?: string;
  contact?: string;
};
export type Solution = {
  id?: string;
  title: string;
  description: string;
  scores?: {
    success_evidence: number;
    practicality: number;
    budget_fit: number;
    similarity: number;
    evidence_quality: number;
  };
  overall_score?: number;
  estimated_budget?: { min: number; max: number; currency: string };
  implementations?: Implementation[];
};
export type Gap = {
  title: string;
  description: string;
  evidence_count: number;
};
export type Research = {
  status?: string;
  mode?: string;
  sources_found?: number;
  solutions?: Solution[];
  market_gaps?: Gap[];
  business_models?: string[];
  comparables?: Implementation[];
  summary?: string;
  market_summary?: string;
  sources?: any[];
  executions?: string[];
};

export async function getItems(kind: string) {
  return fetch(`${API}/api/${kind}`).then((r) => r.json());
}
export async function createItem(kind: string, data: any) {
  return fetch(`${API}/api/${kind}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((r) => r.json());
}
export async function deleteItem(kind: string, id: string) {
  return fetch(`${API}/api/${kind}/${id}`, { method: "DELETE" })
    .then((r) => r.json())
    .catch(() => ({}));
}
export async function researchItem(kind: string, id: string) {
  const k = kind === "hurdles" ? "hurdle" : "vision";
  return fetch(`${API}/api/research/${k}/${id}`, { method: "POST" }).then((r) =>
    r.json(),
  );
}
export async function getResearch(
  kind: string,
  id: string,
  run_id?: string,
): Promise<Research> {
  const k = kind === "hurdles" ? "hurdle" : "vision";
  let url = `${API}/api/research/${k}/${id}`;
  if (run_id) url += `?run_id=${run_id}`;
  return fetch(url).then((r) => r.json());
}
