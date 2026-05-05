import { ArgumentMetadata, BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';

export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    const r = this.schema.safeParse(value);
    if (!r.success) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'Invalid input',
        details: r.error.flatten(),
      });
    }
    return r.data;
  }
}
