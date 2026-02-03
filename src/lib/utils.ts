import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function generateSessionSlug(repo: string, branch: string): string {
  const slugify = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const repoSlug = slugify(repo);
  const branchSlug = slugify(branch);
  const hash = crypto.randomUUID().slice(0, 8);

  return `${repoSlug}-${branchSlug}-${hash}`;
}

export const PORT_RANGE = { min: 4000, max: 4099 } as const;
export function getRandomPort(): number {
  return Math.floor(Math.random() * (PORT_RANGE.max - PORT_RANGE.min + 1)) + PORT_RANGE.min;
}
