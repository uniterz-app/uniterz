/**
 * OpenAI Batch API（Files + Batches）。SDK なし · fetch のみ。
 * @see https://platform.openai.com/docs/guides/batch
 */
import {
  getOpenAiApiKey,
  requireOpenAiApiKey,
} from "@/lib/openai/openaiEnv";

const OPENAI_ROOT = "https://api.openai.com/v1";

export type OpenAiBatchStatus =
  | "validating"
  | "failed"
  | "in_progress"
  | "finalizing"
  | "completed"
  | "expired"
  | "cancelling"
  | "cancelled";

export type OpenAiBatchJob = {
  id: string;
  status: OpenAiBatchStatus;
  input_file_id?: string;
  output_file_id?: string | null;
  error_file_id?: string | null;
  request_counts?: {
    total?: number;
    completed?: number;
    failed?: number;
  };
  errors?: unknown;
};

export type OpenAiBatchJsonlLine = {
  custom_id: string;
  method: "POST";
  url: "/v1/chat/completions";
  body: {
    model: string;
    temperature?: number;
    response_format?: { type: "json_object" };
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  };
};

async function openaiFetch(
  path: string,
  init: RequestInit & { apiKey?: string } = {}
): Promise<Response> {
  const key = init.apiKey ?? requireOpenAiApiKey();
  const { apiKey: _drop, ...rest } = init;
  return fetch(`${OPENAI_ROOT}${path}`, {
    ...rest,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(rest.headers ?? {}),
    },
  });
}

export function isOpenAiConfigured(): boolean {
  return Boolean(getOpenAiApiKey());
}

/** JSONL をアップロード → file id */
export async function uploadOpenAiBatchJsonl(
  jsonl: string,
  filename = "pro-insight-batch.jsonl"
): Promise<string> {
  const key = requireOpenAiApiKey();
  const form = new FormData();
  form.append("purpose", "batch");
  form.append(
    "file",
    new Blob([jsonl], { type: "application/jsonl" }),
    filename
  );
  const res = await fetch(`${OPENAI_ROOT}/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  const json = (await res.json().catch(() => ({}))) as {
    id?: string;
    error?: { message?: string };
  };
  if (!res.ok || !json.id) {
    throw new Error(
      `OpenAI files upload failed: ${res.status} ${json.error?.message ?? ""}`
    );
  }
  return json.id;
}

export async function createOpenAiBatch(input: {
  inputFileId: string;
  endpoint?: "/v1/chat/completions";
  completionWindow?: "24h";
  metadata?: Record<string, string>;
}): Promise<OpenAiBatchJob> {
  const res = await openaiFetch("/batches", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      input_file_id: input.inputFileId,
      endpoint: input.endpoint ?? "/v1/chat/completions",
      completion_window: input.completionWindow ?? "24h",
      metadata: input.metadata,
    }),
  });
  const json = (await res.json().catch(() => ({}))) as OpenAiBatchJob & {
    error?: { message?: string };
  };
  if (!res.ok || !json.id) {
    throw new Error(
      `OpenAI create batch failed: ${res.status} ${json.error?.message ?? ""}`
    );
  }
  return json;
}

export async function getOpenAiBatch(batchId: string): Promise<OpenAiBatchJob> {
  const res = await openaiFetch(`/batches/${encodeURIComponent(batchId)}`);
  const json = (await res.json().catch(() => ({}))) as OpenAiBatchJob & {
    error?: { message?: string };
  };
  if (!res.ok || !json.id) {
    throw new Error(
      `OpenAI get batch failed: ${res.status} ${json.error?.message ?? ""}`
    );
  }
  return json;
}

export async function downloadOpenAiFileText(fileId: string): Promise<string> {
  const res = await openaiFetch(`/files/${encodeURIComponent(fileId)}/content`);
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`OpenAI file download failed: ${res.status} ${t.slice(0, 200)}`);
  }
  return res.text();
}

export function buildBatchJsonl(lines: OpenAiBatchJsonlLine[]): string {
  return lines.map((l) => JSON.stringify(l)).join("\n") + "\n";
}

/** Chat Completions 即時（patch 用） */
export async function openAiChatCompletionJson(input: {
  model: string;
  system: string;
  user: string;
  temperature?: number;
}): Promise<string> {
  const res = await openaiFetch("/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: input.model,
      temperature: input.temperature ?? 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
    }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(
      `OpenAI chat failed: ${res.status} ${json.error?.message ?? ""}`
    );
  }
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI chat returned empty content");
  return content;
}
