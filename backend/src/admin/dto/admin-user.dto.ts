import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class PatchAdminUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @IsOptional()
  @IsEnum(['platform_admin', 'user'])
  platformRole?: 'platform_admin' | 'user';

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AdminResetPasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}
