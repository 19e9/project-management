import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type InvoiceDocument = HydratedDocument<Invoice>;

@Schema({ _id: false })
export class InvoiceLineItem {
  @Prop({ required: true })
  description!: string;

  @Prop({ default: 1 })
  quantity!: number;

  @Prop({ required: true })
  unitAmountUsd!: number;
}
const LineSchema = SchemaFactory.createForClass(InvoiceLineItem);

@Schema({ timestamps: true })
export class Invoice {
  @Prop({ required: true, unique: true, trim: true })
  invoiceNumber!: string;

  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  @Prop({
    enum: ['draft', 'open', 'paid', 'void', 'uncollectible'],
    default: 'open',
    index: true,
  })
  status!: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

  @Prop({ default: 'USD' })
  currency!: string;

  @Prop({ required: true })
  amountDueFinalUsd!: number;

  @Prop({ type: [LineSchema], default: [] })
  lineItems!: InvoiceLineItem[];

  @Prop({ type: Date, index: true })
  issuedAt!: Date;

  @Prop({ type: Date, index: true })
  dueAt!: Date;

  @Prop({ type: Date })
  paidAt?: Date;

  @Prop({ enum: ['subscription', 'manual', 'contract', 'adjustment'], default: 'subscription' })
  source!: 'subscription' | 'manual' | 'contract' | 'adjustment';

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
InvoiceSchema.index({ workspaceId: 1, issuedAt: -1 });
