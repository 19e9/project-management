import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BillingModule } from '../billing/billing.module';
import { UsersModule } from '../users/users.module';
import { Workspace, WorkspaceSchema } from './schemas/workspace.schema';
import {
  WorkspaceMember,
  WorkspaceMemberSchema,
} from './schemas/workspace-member.schema';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';

@Module({
  imports: [
    UsersModule,
    BillingModule,
    MongooseModule.forFeature([
      { name: Workspace.name, schema: WorkspaceSchema },
      { name: WorkspaceMember.name, schema: WorkspaceMemberSchema },
    ]),
  ],
  providers: [WorkspacesService],
  controllers: [WorkspacesController],
  exports: [WorkspacesService, MongooseModule],
})
export class WorkspacesModule {}
