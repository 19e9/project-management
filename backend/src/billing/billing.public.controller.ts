import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { BillingService } from './billing.service';
import type { PublicPricingResponse } from './billing.types';

@ApiTags('public')
@Controller('public')
export class BillingPublicController {
  constructor(private readonly billing: BillingService) {}

  @Public()
  @Get('pricing-plans')
  pricingPlans(): Promise<PublicPricingResponse> {
    return this.billing.listPublicPricingPlans();
  }
}
