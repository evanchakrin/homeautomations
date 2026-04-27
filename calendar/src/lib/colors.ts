export const PALETTE = [
  "#E07A5F", "#3D5A80", "#81B29A", "#F2CC8F", "#9D4EDD",
  "#2A9D8F", "#E76F51", "#264653", "#F4A261", "#8338EC",
  "#06A77D", "#D62828", "#1D4E89", "#A663CC", "#F77F00",
];

export function nextColor(used: string[]): string {
  for (const c of PALETTE) if (!used.includes(c)) return c;
  return PALETTE[Math.floor(Math.random() * PALETTE.length)];
}

export function hexToRgba(hex: string, alpha = 1): string {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
