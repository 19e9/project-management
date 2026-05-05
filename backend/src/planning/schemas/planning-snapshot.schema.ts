import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PlanningSnapshotDocument = HydratedDocument<PlanningSnapshot>;

@Schema({ timestamps: true })
export class PlanningSnapshot {
  @Prop({
    type: Types.ObjectId,
    ref: 'Project',
    required: true,
    unique: true,
    index: true,
  })
  projectId!: Types.ObjectId;

  @Prop({ type: Date, required: true })
  computedAt!: Date;

  @Prop({ type: Date, required: true })
  projectStart!: Date;

  @Prop({ type: Date, required: true })
  projectEnd!: Date;

  @Prop({ type: Number, required: true })
  durationDays!: number;

  @Prop({ type: [String], default: [] })
  criticalTaskIds!: string[];

  @Prop({ type: Object, default: {} })
  cpmByTaskId!: Record<
    string,
    {
      es: string;
      ef: string;
      ls: string;
      lf: string;
      slackMinutes: number;
      isCritical: boolean;
    }
  >;
}

export const PlanningSnapshotSchema =
  SchemaFactory.createForClass(PlanningSnapshot);
