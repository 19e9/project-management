import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TaskDependencyDocument = HydratedDocument<TaskDependency>;

@Schema({ timestamps: true })
export class TaskDependency {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Task', required: true })
  predecessorId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Task', required: true })
  successorId!: Types.ObjectId;

  @Prop({ enum: ['FS', 'SS', 'FF', 'SF'], default: 'FS' })
  type!: 'FS' | 'SS' | 'FF' | 'SF';

  @Prop({ default: 0 })
  lagDays!: number;
}

export const TaskDependencySchema = SchemaFactory.createForClass(TaskDependency);
TaskDependencySchema.index(
  { projectId: 1, predecessorId: 1, successorId: 1 },
  { unique: true },
);
TaskDependencySchema.index({ projectId: 1, successorId: 1 });
TaskDependencySchema.index({ projectId: 1, predecessorId: 1 });
