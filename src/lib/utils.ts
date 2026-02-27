import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function prepareMarkdown(md: string): string {
  return md
    // Ensure blank line before headings
    .replace(/([^\n])\n(#{1,6} )/g, '$1\n\n$2')
    // Ensure blank line after headings
    .replace(/(#{1,6} .+)\n([^\n#])/g, '$1\n\n$2')
    // Ensure blank lines around --- dividers
    .replace(/([^\n])\n---/g, '$1\n\n---')
    .replace(/---\n([^\n])/g, '---\n\n$1')
    // Ensure blank line before list items that follow non-list content
    .replace(/([^\n-*\d])\n([*-] |\d+\. )/g, '$1\n\n$2')
    // Ensure bold lines on their own get spacing
    .replace(/([^\n])\n(\*\*[^*]+\*\*:)/g, '$1\n\n$2')
}
