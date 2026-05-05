import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;
}

export class UpdateWorkspaceDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;
}

export class InviteMemberDto {
  @IsEmail()
  email!: string;

  @IsIn(['owner', 'member', 'client'])
  role!: 'owner' | 'member' | 'client';
}

export class UpdateMemberRoleDto {
  @IsIn(['owner', 'member', 'client'])
  role!: 'owner' | 'member' | 'client';
}
