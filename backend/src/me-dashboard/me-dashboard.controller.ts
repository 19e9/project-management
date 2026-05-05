import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { MeDashboardService } from './me-dashboard.service';

@ApiBearerAuth()
@ApiTags('me-dashboard')
@Controller('me/dashboard')
export class MeDashboardController {
  constructor(private readonly svc: MeDashboardService) {}

  @Get()
  get(@CurrentUser() user: JwtPayload) {
    return this.svc.compute(user.sub);
  }
}
