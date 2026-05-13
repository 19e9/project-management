import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export const WORKSPACE_ROLES = ['owner', 'admin', 'member', 'viewer', 'client'] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

/** Roles allowed when adding someone via POST .../invites (not owner/admin promotion). */
export const INVITE_WORKSPACE_ROLES = ['member', 'viewer'] as const;
export type InviteWorkspaceRole = (typeof INVITE_WORKSPACE_ROLES)[number];

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

  @IsIn([...INVITE_WORKSPACE_ROLES])
  role!: InviteWorkspaceRole;
}

export class UpdateMemberRoleDto {
  @IsIn(WORKSPACE_ROLES)
  role!: WorkspaceRole;
}
