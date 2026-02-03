import type { ApiRouter } from "@api";
import { treaty } from "@elysiajs/eden";

const client = treaty<ApiRouter>("http://localhost:3000");
export const api = client.api;

export function unwrap<T>(res: { data: T; error: unknown }): T {
  if (res.error) {
    const err = res.error as { value?: { error?: string } | string };
    const message =
      typeof err.value === "string"
        ? err.value
        : typeof err.value === "object" && err.value?.error
          ? err.value.error
          : "An unexpected error occurred";
    throw new Error(message);
  }
  return res.data;
}
