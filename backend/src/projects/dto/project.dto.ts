import { Type } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
}

export class UpdateProjectDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(160)
  name?: string;

  @IsOptional() @IsString() @MaxLength(5000)
  description?: string;

  @IsOptional() @IsString() @MaxLength(20)
  code?: string;

  @IsOptional() @Type(() => Date) @IsDate()
  startDate?: Date;

  @IsOptional() @Type(() => Date) @IsDate()
  endDate?: Date;

  @IsOptional() @IsIn(['active', 'archived'])
  status?: 'active' | 'archived';

  @IsOptional() @IsString()
  leadId?: string;
}
