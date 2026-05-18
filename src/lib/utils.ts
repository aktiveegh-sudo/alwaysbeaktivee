import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatGHS(amount: number | string) {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return `₵${n.toFixed(2)}`;
}
