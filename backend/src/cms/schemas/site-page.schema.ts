import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SitePageDocument = HydratedDocument<SitePage>;

@Schema({ timestamps: true, collection: 'site_pages' })
export class SitePage {
  @Prop({ required: true, unique: true, lowercase: true, trim: true, maxlength: 120 })
  slug!: string;

  @Prop({ required: true, maxlength: 200 })
  title!: string;

  @Prop({ default: '' })
  body!: string;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: 0 })
  navSortOrder!: number;

  @Prop({ default: false })
  showInNav!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export const SitePageSchema = SchemaFactory.createForClass(SitePage);
