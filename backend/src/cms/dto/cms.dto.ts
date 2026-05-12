import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSitePageDto {
  @IsString()
  @MaxLength(120)
  slug!: string;

  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200_000)
  body?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  showInNav?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  navSortOrder?: number;
}

export class PatchSitePageDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200_000)
  body?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  showInNav?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  navSortOrder?: number;
}

export class FooterLinkDto {
  @IsString()
  @MaxLength(120)
  label!: string;

  @IsString()
  @MaxLength(500)
  href!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class FooterColumnDto {
  @IsString()
  @MaxLength(80)
  title!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FooterLinkDto)
  links?: FooterLinkDto[];
}

export class NavShortcutDto {
  @IsString()
  @MaxLength(120)
  label!: string;

  @IsString()
  @MaxLength(500)
  href!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ReplaceSiteFooterDto {
  @IsString()
  @MaxLength(2000)
  footerTagline!: string;

  @IsString()
  @MaxLength(120)
  secondaryCtaLabel!: string;

  @IsString()
  @MaxLength(500)
  secondaryCtaHref!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FooterColumnDto)
  columns!: FooterColumnDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NavShortcutDto)
  topNavLinks!: NavShortcutDto[];
}
