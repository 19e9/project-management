import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ProjectsModule } from '../projects/projects.module';
import { TasksModule } from '../tasks/tasks.module';
import { MeDashboardService } from './me-dashboard.service';
import { MeDashboardController } from './me-dashboard.controller';

@Module({
  imports: [UsersModule, WorkspacesModule, ProjectsModule, TasksModule],
  providers: [MeDashboardService],
  controllers: [MeDashboardController],
})
export class MeDashboardModule {}
