import { BadRequestException } from '@nestjs/common';

export type SortOrder = 'asc' | 'desc';

export function buildOrderBy<T extends string>(
  sortBy: string | undefined,
  allowedFields: readonly T[],
  defaultField: T,
  order: SortOrder = 'asc',
): Array<Record<string, SortOrder>> {
  const field = sortBy ?? defaultField;
  if (!(allowedFields as readonly string[]).includes(field)) {
    throw new BadRequestException({
      code: 'INVALID_SORT_FIELD',
      message: `sortBy must be one of: ${allowedFields.join(', ')}.`,
    });
  }
  return [{ [field]: order }, { id: 'asc' }];
}