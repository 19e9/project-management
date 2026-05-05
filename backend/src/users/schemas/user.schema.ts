import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, lowercase: true, trim: true, unique: true })
  email!: string;

  @Prop({ select: false })
  passwordHash?: string;

  @Prop({ required: true })
  displayName!: string;

  @Prop({ type: [String], default: ['local'] })
  authProviders!: string[];

  @Prop({ index: true, sparse: true })
  googleId?: string;

  @Prop()
  avatarUrl?: string;

  @Prop({ enum: ['platform_admin', 'user'], default: 'user' })
  platformRole!: 'platform_admin' | 'user';

  @Prop({ default: 'UTC' })
  timezone!: string;

  @Prop({ default: true })
  isActive!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ email: 1 }, { unique: true });
