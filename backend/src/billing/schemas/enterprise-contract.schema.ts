import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type EnterpriseContractDocument = HydratedDocument<EnterpriseContract>;

@Schema({ timestamps: true })
export class EnterpriseContract {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true, index: true })
  workspaceId!: Types.ObjectId;

  /** Negotiated fixed monthly (USD) — included in MRR for enterprise. */
  @Prop({ required: true })
  monthlyAmountUsd!: number;

  @Prop({ type: Date, required: true })
  contractStart!: Date;

  @Prop({ type: Date })
  contractEnd?: Date;

  @Prop({ type: Date, index: true })
  trialEndsAt?: Date;

  @Prop({ trim: true })
  notes?: string;

  /** Placeholder paths / URLs for operator-uploaded PDFs. */
  @Prop({ type: [String], default: [] })
  manualInvoiceUrls!: string[];
}

export const EnterpriseContractSchema = SchemaFactory.createForClass(EnterpriseContract);
EnterpriseContractSchema.index({ workspaceId: 1 }, { unique: true });
