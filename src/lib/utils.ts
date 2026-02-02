import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function getRandomPort(): number {
  const min = 4000;
  const max = 60000;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
