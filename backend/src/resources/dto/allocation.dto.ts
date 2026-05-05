import { Type } from 'class-transformer';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateAllocationDto {
  @IsString() taskId!: string;
  @IsString() userId!: string;

  @Type(() => Date) @IsDate()
  startDate!: Date;

  @Type(() => Date) @IsDate()
  endDate!: Date;

  @IsNumber() @Min(0) @Max(100)
  unitsPct!: number;

  @IsOptional() @IsNumber() @Min(0)
  plannedHours?: number;
}

export class UpdateAllocationDto {
  @IsOptional() @Type(() => Date) @IsDate() startDate?: Date;
  @IsOptional() @Type(() => Date) @IsDate() endDate?: Date;
  @IsOptional() @IsNumber() @Min(0) @Max(100) unitsPct?: number;
  @IsOptional() @IsNumber() @Min(0) plannedHours?: number;
  @IsOptional() @IsNumber() @Min(0) actualHours?: number;
}
