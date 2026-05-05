import { Module } from '@nestjs/common';
import { TasksModule } from '../tasks/tasks.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [TasksModule, WorkspacesModule],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}
