import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TaskDocument = HydratedDocument<Task>;

@Schema({ timestamps: true })
export class Task {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop()
  wbsCode?: string;

  @Prop({ type: Types.ObjectId, ref: 'Task', default: null, index: true })
  parentTaskId!: Types.ObjectId | null;

  @Prop({ type: Date, required: true })
  startDate!: Date;

  @Prop({ type: Date, required: true })
  endDate!: Date;

  @Prop({ type: Number, default: 1, min: 1 })
  durationDays!: number;

  @Prop({
    enum: ['not_started', 'in_progress', 'blocked', 'done', 'cancelled'],
    default: 'not_started',
  })
  status!: string;

  @Prop({ enum: ['low', 'medium', 'high', 'critical'], default: 'medium' })
  priority!: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  assigneeIds!: Types.ObjectId[];

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  progressPct!: number;

  @Prop({ type: Object, default: {} })
  customFields!: Record<string, unknown>;

  @Prop({ default: 0 })
  sortOrder!: number;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
TaskSchema.index({ projectId: 1, parentTaskId: 1, sortOrder: 1 });
TaskSchema.index({ projectId: 1, status: 1 });
TaskSchema.index({ projectId: 1, startDate: 1 });
