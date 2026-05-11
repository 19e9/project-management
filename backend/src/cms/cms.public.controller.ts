import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CmsService } from './cms.service';

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
}
