import { BadRequestException } from '@nestjs/common';

export function validationError(details: string[]) {
  return new BadRequestException({
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    details,
  });
}