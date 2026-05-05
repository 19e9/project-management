import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WorkspaceMemberDocument = HydratedDocument<WorkspaceMember>;

@Schema({ timestamps: true })
export class WorkspaceMember {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true })
  workspaceId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ enum: ['owner', 'member', 'client'], required: true })
  role!: 'owner' | 'member' | 'client';

  @Prop({ enum: ['invited', 'active', 'removed'], default: 'active' })
  status!: 'invited' | 'active' | 'removed';
}

export const WorkspaceMemberSchema = SchemaFactory.createForClass(WorkspaceMember);
WorkspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });
WorkspaceMemberSchema.index({ userId: 1 });
