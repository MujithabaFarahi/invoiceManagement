import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const toFixed2 = (value: number | string): number =>
  +parseFloat(String(value)).toFixed(2);

export function getPaginationRange(
  current: number,
  total: number
): (number | string)[] {
  const delta = 1;
  const range: (number | string)[] = [];

  for (let i = 1; i <= total; i++) {
    if (
      i <= 2 || // first 2
      i > total - 2 || // last 2
      (i >= current - delta && i <= current + delta) // around current
    ) {
      range.push(i);
    } else if (range[range.length - 1] !== '...') {
      range.push('...');
    }
  }

  return range;
}
