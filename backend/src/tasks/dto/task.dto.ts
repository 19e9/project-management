import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
const STATUSES = [
  'not_started',
  'in_progress',
  'blocked',
  'done',
  'cancelled',
] as const;

export class CreateTaskDto {
  @IsString() @MinLength(1) @MaxLength(200)
  title!: string;

  @IsOptional() @IsString() @MaxLength(10_000)
  description?: string;

  @IsOptional() @ValidateIf((o) => o.parentTaskId !== null) @IsString()
  parentTaskId?: string | null;

  @IsOptional() @IsString() @MaxLength(40)
  wbsCode?: string;

  @Type(() => Date) @IsDate()
  startDate!: Date;

  @Type(() => Date) @IsDate()
  endDate!: Date;

  @IsInt() @Min(1) @Max(3650)
  durationDays!: number;

  @IsOptional() @IsIn(PRIORITIES)
  priority?: (typeof PRIORITIES)[number];

  @IsOptional() @IsIn(STATUSES)
  status?: (typeof STATUSES)[number];

  @IsOptional() @IsArray()
  assigneeIds?: string[];

  @IsOptional() @IsNumber() @Min(0) @Max(100)
  progressPct?: number;

  @IsOptional() @IsInt()
  sortOrder?: number;
}

export class UpdateTaskDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(200)
  title?: string;

  @IsOptional() @IsString() @MaxLength(10_000)
  description?: string;

  @IsOptional() @ValidateIf((o) => o.parentTaskId !== null) @IsString()
  parentTaskId?: string | null;

  @IsOptional() @IsString() @MaxLength(40)
  wbsCode?: string;

  @IsOptional() @Type(() => Date) @IsDate()
  startDate?: Date;

  @IsOptional() @Type(() => Date) @IsDate()
  endDate?: Date;

  @IsOptional() @IsInt() @Min(1) @Max(3650)
  durationDays?: number;

  @IsOptional() @IsIn(PRIORITIES)
  priority?: (typeof PRIORITIES)[number];

  @IsOptional() @IsIn(STATUSES)
  status?: (typeof STATUSES)[number];

  @IsOptional() @IsArray()
  assigneeIds?: string[];

  @IsOptional() @IsNumber() @Min(0) @Max(100)
  progressPct?: number;

  @IsOptional() @IsInt()
  sortOrder?: number;
}

export class ListTasksQueryDto {
  @IsOptional() @IsIn(STATUSES)
  status?: (typeof STATUSES)[number];

  @IsOptional() @IsString()
  assigneeId?: string;

  @IsOptional() @IsString()
  parentTaskId?: string;
}
