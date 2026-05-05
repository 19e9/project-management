import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WorkspaceDocument = HydratedDocument<Workspace>;

@Schema({ _id: false })
export class Entitlements {
  @Prop({ default: 10 })
  maxMembers!: number;

  @Prop({ default: 3 })
  maxProjects!: number;

  @Prop({ default: true })
  ganttEnabled!: boolean;

  @Prop({ default: false })
  cpmEnabled!: boolean;

  @Prop({ default: false })
  auditLogEnabled!: boolean;
}
const EntitlementsSchemaInternal = SchemaFactory.createForClass(Entitlements);

@Schema({ timestamps: true })
export class Workspace {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  ownerId!: Types.ObjectId;

  @Prop({ enum: ['free', 'pro', 'enterprise'], default: 'free' })
  plan!: 'free' | 'pro' | 'enterprise';

  @Prop({ enum: ['active', 'suspended'], default: 'active' })
  status!: 'active' | 'suspended';

  @Prop({ type: Types.ObjectId, ref: 'SubscriptionPlan', index: true })
  subscriptionPlanId?: Types.ObjectId;

  @Prop({ type: Date, index: true })
  trialEndsAt?: Date;

  @Prop({ type: EntitlementsSchemaInternal, default: () => ({}) })
  entitlements!: Entitlements;
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);

export const PLAN_DEFAULTS: Record<
  Workspace['plan'],
  Omit<Entitlements, never>
> = {
  free: {
    maxMembers: 10,
    maxProjects: 3,
    ganttEnabled: true,
    cpmEnabled: false,
    auditLogEnabled: false,
  },
  pro: {
    maxMembers: 50,
    maxProjects: 50,
    ganttEnabled: true,
    cpmEnabled: true,
    auditLogEnabled: false,
  },
  enterprise: {
    maxMembers: 100_000,
    maxProjects: 100_000,
    ganttEnabled: true,
    cpmEnabled: true,
    auditLogEnabled: true,
  },
};
