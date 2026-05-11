import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type SiteFooterConfigDocument = HydratedDocument<SiteFooterConfig>;

const FooterLinkSchema = new MongooseSchema(
  {
    label: { type: String, required: true, maxlength: 120 },
    href: { type: String, required: true, maxlength: 500 },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false },
);

const FooterColumnSchema = new MongooseSchema(
  {
    title: { type: String, required: true, maxlength: 80 },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    links: { type: [FooterLinkSchema], default: [] },
  },
  { _id: false },
);

export type FooterLinkEmbed = {
  label: string;
  href: string;
  sortOrder: number;
  isActive: boolean;
};

export type FooterColumnEmbed = {
  title: string;
  sortOrder: number;
  isActive: boolean;
  links: FooterLinkEmbed[];
};

export type NavShortcutEmbed = {
  label: string;
  href: string;
  sortOrder: number;
  isActive: boolean;
};

const NavShortcutSchema = new MongooseSchema(
  {
    label: { type: String, required: true, maxlength: 120 },
    href: { type: String, required: true, maxlength: 500 },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false },
);

@Schema({ timestamps: true, collection: 'site_footer_configs' })
export class SiteFooterConfig {
  @Prop({ unique: true, default: 'default' })
  configKey!: string;

  /** Marketing blurb shown above CTAs in the landing footer. */
  @Prop({
    default:
      'Plan, schedule and ship faster. PlanForge brings Gantt, WBS and the Critical Path Method into one calm, modern workspace.',
    maxlength: 2000,
  })
  footerTagline!: string;

  @Prop({ default: 'See pricing →', maxlength: 120 })
  secondaryCtaLabel!: string;

  @Prop({ default: '/#pricing', maxlength: 500 })
  secondaryCtaHref!: string;

  @Prop({ type: [FooterColumnSchema], default: [] })
  columns!: FooterColumnEmbed[];

  @Prop({ type: [NavShortcutSchema], default: [] })
  topNavLinks!: NavShortcutEmbed[];
}

export const SiteFooterConfigSchema = SchemaFactory.createForClass(SiteFooterConfig);
