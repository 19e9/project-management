import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PaymentDocument = HydratedDocument<Payment>;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Invoice', index: true })
  invoiceId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({ required: true })
  amountUsd!: number;

  @Prop({ default: 'USD' })
  currency!: string;

  @Prop({
    enum: ['pending', 'processing', 'succeeded', 'failed', 'refunded', 'cancelled'],
    default: 'pending',
    index: true,
  })
  status!: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'cancelled';

  @Prop({ enum: ['card', 'ach', 'wire', 'manual', 'other'], default: 'card' })
  method!: 'card' | 'ach' | 'wire' | 'manual' | 'other';

  @Prop({ trim: true })
  providerRef?: string;

  @Prop({ trim: true })
  failureCode?: string;

  @Prop({ trim: true })
  failureMessage?: string;

  @Prop({ default: 0 })
  attemptCount!: number;

  @Prop({ type: Date })
  nextRetryAt?: Date;

  @Prop({ type: Date })
  settledAt?: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
PaymentSchema.index({ workspaceId: 1, createdAt: -1 });
PaymentSchema.index({ status: 1, nextRetryAt: 1 });
