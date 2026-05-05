import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import configuration, { validate } from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { DependenciesModule } from './dependencies/dependencies.module';
import { ResourcesModule } from './resources/resources.module';
import { PlanningModule } from './planning/planning.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdminModule } from './admin/admin.module';
import { MeDashboardModule } from './me-dashboard/me-dashboard.module';
import { BillingModule } from './billing/billing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        uri: cfg.get<string>('MONGODB_URI'),
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 200 }]),
    AuthModule,
    UsersModule,
    WorkspacesModule,
    ProjectsModule,
    TasksModule,
    DependenciesModule,
    ResourcesModule,
    PlanningModule,
    AnalyticsModule,
    AdminModule,
    MeDashboardModule,
    BillingModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
