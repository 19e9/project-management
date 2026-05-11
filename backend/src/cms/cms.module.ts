import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SitePage, SitePageSchema } from './schemas/site-page.schema';
import {
  SiteFooterConfig,
  SiteFooterConfigSchema,
} from './schemas/site-footer.schema';
import { CmsService } from './cms.service';
import { CmsPublicController } from './cms.public.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SitePage.name, schema: SitePageSchema },
      { name: SiteFooterConfig.name, schema: SiteFooterConfigSchema },
    ]),
  ],
  controllers: [CmsPublicController],
  providers: [CmsService],
  exports: [CmsService],
})
export class CmsModule {}
