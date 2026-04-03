/**
 * Simple class name merger.
 * In a full shadcn/ui setup, this would use clsx and tailwind-merge.
 */
export function cn(...inputs: (string | undefined | null | boolean | { [key: string]: any })[]) {
  return inputs
    .flatMap((input) => {
      if (!input) return [];
      if (typeof input === "string") return [input];
      if (Array.isArray(input)) return input;
      return Object.entries(input)
        .filter(([_, value]) => !!value)
        .map(([key, _]) => key);
    })
    .join(" ");
}
