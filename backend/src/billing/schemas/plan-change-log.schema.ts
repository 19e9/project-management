import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PlanChangeLogDocument = HydratedDocument<PlanChangeLog>;

@Schema({ timestamps: true })
export class PlanChangeLog {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ trim: true })
  fromPlanKey!: string;

  @Prop({ trim: true })
  toPlanKey!: string;

  @Prop({ enum: ['free', 'pro', 'enterprise'] })
  fromTier?: 'free' | 'pro' | 'enterprise';

  @Prop({ enum: ['free', 'pro', 'enterprise'] })
  toTier?: 'free' | 'pro' | 'enterprise';

  @Prop({ type: Types.ObjectId, ref: 'User' })
  actorUserId?: Types.ObjectId;

  @Prop({ trim: true })
  reason?: string;

  @Prop({ default: 0 })
  estimatedMrrBeforeUsd!: number;

  @Prop({ default: 0 })
  estimatedMrrAfterUsd!: number;

  @Prop({ type: Date, default: () => new Date(), index: true })
  changedAt!: Date;
}

export const PlanChangeLogSchema = SchemaFactory.createForClass(PlanChangeLog);
