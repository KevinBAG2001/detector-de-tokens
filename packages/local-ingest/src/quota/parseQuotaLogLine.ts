export interface ParsedQuotaExhaustionLine {
  detectedAt: Date;
  resetAt: Date;
  resetsInSeconds: number;
}

const LINE_TIMESTAMP =
  /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?/;

const RESETS_IN = /Resets in (\d+)h(\d+)m(\d+)s/i;

const QUOTA_MARKERS = /Individual quota reached/i;
const CODE_429 = /(?:code 429|RESOURCE_EXHAUSTED)/i;

function parseLocalTimestamp(prefix: string): Date | null {
  const match = prefix.match(LINE_TIMESTAMP);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const fraction = match[7] ?? '0';
  const millis = Number(fraction.padEnd(3, '0').slice(0, 3));

  if (
    [year, month, day, hour, minute, second, millis].some((n) => Number.isNaN(n))
  ) {
    return null;
  }

  return new Date(year, month - 1, day, hour, minute, second, millis);
}

function parseResetsInSeconds(line: string): number | null {
  const match = line.match(RESETS_IN);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  if ([hours, minutes, seconds].some((n) => Number.isNaN(n))) {
    return null;
  }

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Extrae cuota individual agotada (429) y tiempo de reseteo relativo de una línea de log IDE.
 */
export function parseQuotaExhaustionLogLine(line: string): ParsedQuotaExhaustionLine | null {
  const normalized = line.replace(/\r$/, '').trim();
  if (!normalized || !QUOTA_MARKERS.test(normalized) || !CODE_429.test(normalized)) {
    return null;
  }

  const resetsInSeconds = parseResetsInSeconds(normalized);
  if (resetsInSeconds === null) {
    return null;
  }

  const detectedAt = parseLocalTimestamp(normalized);
  if (!detectedAt || Number.isNaN(detectedAt.getTime())) {
    return null;
  }

  const resetAt = new Date(detectedAt.getTime() + resetsInSeconds * 1000);

  return {
    detectedAt,
    resetAt,
    resetsInSeconds,
  };
}
