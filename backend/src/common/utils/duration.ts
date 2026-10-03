const UNITS = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 } as const;

export function parseDurationMs(value: string): number {
  const match = /^(\d+)\s*(s|m|h|d)$/.exec(value.trim());
  if (!match) {
    throw new Error('JWT_EXPIRES_IN must look like 30m, 12h or 1d');
  }
  return Number(match[1]) * UNITS[match[2] as keyof typeof UNITS];
}