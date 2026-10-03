import { applyDecorators } from '@nestjs/common';
import { IsISO8601, Matches } from 'class-validator';

const ISO_WITH_ZONE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})$/;

export function IsIsoDateTime() {
  return applyDecorators(
    Matches(ISO_WITH_ZONE, {
      message:
        '$property must be an ISO 8601 date-time with a timezone, for example 2026-10-10T00:00:00Z',
    }),
    IsISO8601({ strict: true }),
  );
}