import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SeatEventDocument = HydratedDocument<SeatEvent>;

@Schema({ timestamps: true })
export class SeatEvent {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ enum: ['owner', 'member', 'client'] })
  role!: 'owner' | 'member' | 'client';

  @Prop({ enum: ['added', 'removed', 'role_changed', 'reactivated'], required: true })
  action!: 'added' | 'removed' | 'role_changed' | 'reactivated';

  @Prop({ default: false })
  billableAfter!: boolean;

  @Prop({ type: Date, default: () => new Date(), index: true })
  occurredAt!: Date;
}

export const SeatEventSchema = SchemaFactory.createForClass(SeatEvent);
