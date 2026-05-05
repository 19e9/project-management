import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProjectDocument = HydratedDocument<Project>;

@Schema({ timestamps: true })
export class Project {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop()
  code?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  leadId?: Types.ObjectId;

  @Prop({ enum: ['active', 'archived'], default: 'active' })
  status!: 'active' | 'archived';

  @Prop({ type: Date })
  startDate?: Date;

  @Prop({ type: Date })
  endDate?: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
ProjectSchema.index({ workspaceId: 1, status: 1 });
ProjectSchema.index({ workspaceId: 1, name: 1 });
