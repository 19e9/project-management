import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { BillingModule } from '../billing/billing.module';
import { UsersModule } from '../users/users.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ProjectsModule } from '../projects/projects.module';
import { TasksModule } from '../tasks/tasks.module';
import { ResourcesModule } from '../resources/resources.module';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

import { CmsModule } from '../cms/cms.module';

@Module({
  imports: [
    MongooseModule,
    AuthModule,
    BillingModule,
    CmsModule,
    UsersModule,
    WorkspacesModule,
    ProjectsModule,
    TasksModule,
    ResourcesModule,
  ],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
