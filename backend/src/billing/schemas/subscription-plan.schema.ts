import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SubscriptionPlanDocument = HydratedDocument<SubscriptionPlan>;

@Schema({ timestamps: true })
export class SubscriptionPlan {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  key!: string;

  @Prop({ required: true, trim: true })
  displayName!: string;

  @Prop({ enum: ['free', 'pro', 'enterprise'], required: true, index: true })
  tier!: 'free' | 'pro' | 'enterprise';

  /** Per billable seat / month (USD). Enterprise template may be 0 and use contracts. */
  @Prop({ default: 0 })
  pricePerSeatMonthlyUsd!: number;

  @Prop({ default: 10 })
  maxMembers!: number;

  @Prop({ default: 3 })
  maxProjects!: number;

  @Prop({ default: 5120 })
  storageLimitMb!: number;

  @Prop({ default: true })
  ganttEnabled!: boolean;

  @Prop({ default: false })
  cpmEnabled!: boolean;

  @Prop({ default: false })
  auditLogEnabled!: boolean;

  @Prop({ default: true })
  isActive!: boolean;

  /** One default per tier for auto-assignment. */
  @Prop({ default: false })
  isDefaultForTier!: boolean;

  @Prop({ default: 0 })
  sortOrder!: number;

  /** Short paragraph shown on the public pricing card */
  @Prop({ default: '' })
  marketingDescription!: string;

  /** When paying annually: effective discount vs monthly × 12 (0–100). */
  @Prop({ default: 0 })
  annualDiscountPercent!: number;

  /** Highlight card (e.g. “Most popular”) */
  @Prop({ default: false })
  isHighlighted!: boolean;

  @Prop({ default: 'Get started' })
  ctaLabel!: string;

  @Prop({ default: '/register' })
  ctaHref!: string;

  /** Show custom pricing copy instead of numeric seat prices */
  @Prop({ default: false })
  useCustomPricing!: boolean;

  @Prop({ default: '' })
  customPriceLabel!: string;

  /** Extra bullet lines for the pricing card; when empty the API derives bullets from limits & flags */
  @Prop({ type: [String], default: [] })
  marketingBullets!: string[];
}

export const SubscriptionPlanSchema = SchemaFactory.createForClass(SubscriptionPlan);
SubscriptionPlanSchema.index({ tier: 1, isDefaultForTier: 1 });
