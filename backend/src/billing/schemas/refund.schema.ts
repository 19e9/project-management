import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RefundDocument = HydratedDocument<Refund>;

@Schema({ timestamps: true })
export class Refund {
  @Prop({ type: Types.ObjectId, ref: 'Payment', required: true, index: true })
  paymentId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ required: true })
  amountUsd!: number;

  @Prop({ enum: ['pending', 'succeeded', 'failed'], default: 'pending' })
  status!: 'pending' | 'succeeded' | 'failed';

  @Prop({ trim: true })
  reason?: string;
}

export const RefundSchema = SchemaFactory.createForClass(Refund);
