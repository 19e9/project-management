import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ResourceAllocationDocument = HydratedDocument<ResourceAllocation>;

@Schema({ timestamps: true })
export class ResourceAllocation {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
  projectId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Task', required: true })
  taskId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Date, required: true })
  startDate!: Date;

  @Prop({ type: Date, required: true })
  endDate!: Date;

  @Prop({ type: Number, required: true, min: 0, max: 100 })
  unitsPct!: number;

  @Prop({ type: Number, default: 0 })
  plannedHours!: number;

  @Prop({ type: Number, default: 0 })
  actualHours!: number;
}

export const ResourceAllocationSchema =
  SchemaFactory.createForClass(ResourceAllocation);
ResourceAllocationSchema.index({ projectId: 1, userId: 1, startDate: 1 });
ResourceAllocationSchema.index({ taskId: 1 });
