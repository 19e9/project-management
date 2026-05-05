import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateDependencyDto {
  @IsString() predecessorId!: string;
  @IsString() successorId!: string;

  @IsOptional() @IsIn(['FS', 'SS', 'FF', 'SF'])
  type?: 'FS' | 'SS' | 'FF' | 'SF';

  @IsOptional() @IsInt() @Min(-365) @Max(365)
  lagDays?: number;
}
