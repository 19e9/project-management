import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  BadRequestException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { PlatformAdminGuard } from '../common/guards/platform-admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { BillingService } from '../billing/billing.service';
import type { AdminBillingDashboard, AdminWorkspaceBillingDetail } from '../billing/billing.types';
import type { SubscriptionPlan } from '../billing/schemas/subscription-plan.schema';
import {
  AdminInsights,
  AdminOverview,
  AdminPlatformSettings,
  AdminService,
  AdminUserRow,
  AdminWorkspaceRow,
  ActivityEvent,
  GrowthPoint,
  RoleDistribution,
  StatusDistribution,
} from './admin.service';
import { AdminResetPasswordDto, PatchAdminUserDto } from './dto/admin-user.dto';
import { CmsService } from '../cms/cms.service';
import {
  CreateSitePageDto,
  PatchSitePageDto,
  ReplaceSiteFooterDto,
} from '../cms/dto/cms.dto';
import {
  ALLOWED_SITE_MEDIA_MIMES,
  SITE_MEDIA_DIR,
  extFromMime,
} from '../cms/cms-upload.storage';

@ApiBearerAuth()
@ApiTags('admin')
@UseGuards(PlatformAdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly svc: AdminService,
    private readonly billingService: BillingService,
    private readonly cms: CmsService,
  ) {}

  @Get('stats/overview')
  overview(): Promise<AdminOverview> {
    return this.svc.overview();
  }

  @Get('stats/growth')
  growth(@Query('days') days?: string): Promise<GrowthPoint[]> {
    return this.svc.growth(days ? parseInt(days, 10) : 30);
  }

  @Get('stats/tasks-by-status')
  tasksByStatus(): Promise<StatusDistribution> {
    return this.svc.tasksByStatus();
  }

  @Get('stats/role-distribution')
  roleDistribution(): Promise<RoleDistribution> {
    return this.svc.roleDistribution();
  }

  @Get('workspaces')
  workspaces(
    @Query('limit') limit?: string,
    @Query('q') q?: string,
  ): Promise<{ items: AdminWorkspaceRow[] }> {
    return this.svc.workspacesTable({
      limit: limit ? parseInt(limit, 10) : 25,
      q,
    });
  }

  @Get('users')
  users(
    @Query('limit') limit?: string,
    @Query('q') q?: string,
  ): Promise<{ items: AdminUserRow[] }> {
    return this.svc.usersTable({
      limit: limit ? parseInt(limit, 10) : 100,
      q,
    });
  }

  @Patch('users/:id')
  patchUser(
    @Param('id') id: string,
    @Body() dto: PatchAdminUserDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<AdminUserRow> {
    return this.svc.patchAdminUser(user.sub, id, dto);
  }

  @Delete('users/:id')
  softDeleteUser(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.svc.softDeleteAdminUser(user.sub, id);
  }

  @Post('users/:id/reset-password')
  resetPassword(@Param('id') id: string, @Body() dto: AdminResetPasswordDto) {
    return this.svc.adminResetPassword(id, dto.newPassword);
  }

  @Post('users/:id/revoke-sessions')
  revokeSessions(@Param('id') id: string) {
    return this.svc.adminRevokeSessions(id);
  }

  @Get('billing')
  billingDashboard(
    @Query('limit') limit?: string,
    @Query('q') q?: string,
  ): Promise<AdminBillingDashboard> {
    return this.billingService.getAdminDashboard({
      workspaceLimit: limit ? parseInt(limit, 10) : 80,
      workspaceSearch: q,
    });
  }

  @Get('billing/workspaces/:id')
  billingWorkspace(@Param('id') id: string): Promise<AdminWorkspaceBillingDetail> {
    return this.billingService.getWorkspaceDetail(id);
  }

  @Post('billing/workspaces/:id/plan')
  assignPlan(
    @Param('id') id: string,
    @Body() body: { subscriptionPlanId: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.billingService.assignWorkspacePlan(id, body.subscriptionPlanId, user.sub);
  }

  @Post('billing/plans')
  createPlan(@Body() body: Partial<SubscriptionPlan> & { key: string; displayName: string; tier: 'free' | 'pro' | 'enterprise' }) {
    return this.billingService.createSubscriptionPlan(body);
  }

  @Patch('billing/plans/:id')
  updatePlan(@Param('id') id: string, @Body() body: Partial<SubscriptionPlan>) {
    return this.billingService.updateSubscriptionPlan(id, body);
  }

  @Post('billing/plans/:id/deactivate')
  deactivatePlan(@Param('id') id: string) {
    return this.billingService.deactivateSubscriptionPlan(id);
  }

  @Delete('billing/plans/:id')
  deleteSubscriptionPlan(@Param('id') id: string) {
    return this.billingService.deleteSubscriptionPlan(id);
  }

  @Post('billing/workspaces/:id/enterprise-contract')
  enterpriseContract(
    @Param('id') id: string,
    @Body()
    body: {
      monthlyAmountUsd: number;
      contractStart: string;
      contractEnd?: string;
      trialEndsAt?: string;
      notes?: string;
      manualInvoiceUrls?: string[];
    },
  ) {
    return this.billingService.upsertEnterpriseContract(id, body);
  }

  @Get('billing/export/invoices')
  async exportInvoices(@Res({ passthrough: false }) res: Response) {
    const csv = await this.billingService.buildInvoicesCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="invoices.csv"');
    res.send(csv);
  }

  @Get('billing/export/payments')
  async exportPayments(@Res({ passthrough: false }) res: Response) {
    const csv = await this.billingService.buildPaymentsCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="payments.csv"');
    res.send(csv);
  }

  @Get('billing/export/monthly-report')
  async exportMonthlyReport(@Res({ passthrough: false }) res: Response) {
    const csv = await this.billingService.buildMonthlyReportCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="monthly-billing-summary.csv"');
    res.send(csv);
  }

  @Get('billing/invoices/:id/html')
  async invoiceHtml(@Param('id') id: string, @Res({ passthrough: false }) res: Response) {
    const html = await this.billingService.getInvoiceHtml(id);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  @Get('settings')
  settings(): Promise<AdminPlatformSettings> {
    return this.svc.platformSettings();
  }

  @Get('activity')
  activity(@Query('limit') limit?: string): Promise<ActivityEvent[]> {
    return this.svc.activity(limit ? parseInt(limit, 10) : 30);
  }

  @Get('insights')
  insights(): Promise<AdminInsights> {
    return this.svc.insights();
  }

  @Post('cms/site-media')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: SITE_MEDIA_DIR,
        filename: (_req, file, cb) => {
          const ext = extFromMime(file.mimetype);
          if (!ext) {
            cb(new Error('Unsupported mime'), '');
            return;
          }
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        cb(null, ALLOWED_SITE_MEDIA_MIMES.has(file.mimetype));
      },
    }),
  )
  uploadSiteMedia(@UploadedFile() file: Express.Multer.File) {
    if (!file?.filename) {
      throw new BadRequestException('Dosya yüklenemedi veya türü geçersiz.');
    }
    return { filename: file.filename };
  }

  @Get('site-pages')
  sitePagesAdminList() {
    return this.cms.adminListPages();
  }

  @Post('site-pages')
  sitePagesAdminCreate(@Body() dto: CreateSitePageDto) {
    return this.cms.adminCreatePage(dto);
  }

  @Patch('site-pages/:id')
  sitePagesAdminPatch(@Param('id') id: string, @Body() dto: PatchSitePageDto) {
    return this.cms.adminPatchPage(id, dto);
  }

  @Delete('site-pages/:id')
  sitePagesAdminDelete(@Param('id') id: string) {
    return this.cms.adminDeletePage(id);
  }

  @Get('site-footer')
  siteFooterAdminGet() {
    return this.cms.adminGetFooter();
  }

  @Put('site-footer')
  siteFooterAdminPut(@Body() dto: ReplaceSiteFooterDto) {
    return this.cms.adminReplaceFooter(dto);
  }
}
