import {
  Controller,
  Get,
  NotFoundException,
  Param,
  StreamableFile,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import { Public } from '../common/decorators/public.decorator';
import { CmsService } from './cms.service';
import {
  SITE_MEDIA_DIR,
  assertSafeSiteMediaFilename,
  contentTypeForSiteMediaFilename,
} from './cms-upload.storage';

@ApiTags('public')
@Controller('public')
export class CmsPublicController {
  constructor(private readonly cms: CmsService) {}

  @Public()
  @Get('site-pages')
  listPages() {
    return this.cms.publicListPages();
  }

  @Public()
  @Get('site-nav')
  navLinks() {
    return this.cms.publicNavLinks();
  }

  @Public()
  @Get('site-pages/:slug')
  page(@Param('slug') slug: string) {
    return this.cms.publicPageBySlug(slug);
  }

  @Public()
  @Get('site-footer')
  footer() {
    return this.cms.publicFooter();
  }

  @Public()
  @Get('site-media/:filename')
  siteMedia(@Param('filename') raw: string): StreamableFile {
    const filename = assertSafeSiteMediaFilename(raw);
    const abs = join(SITE_MEDIA_DIR, filename);
    if (!existsSync(abs)) throw new NotFoundException();
    const stream = createReadStream(abs);
    return new StreamableFile(stream, {
      type: contentTypeForSiteMediaFilename(filename),
      disposition: `inline; filename="${filename}"`,
    });
  }
}
