import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TasksModule } from '../tasks/tasks.module';
import { DependenciesModule } from '../dependencies/dependencies.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import {
  PlanningSnapshot,
  PlanningSnapshotSchema,
} from './schemas/planning-snapshot.schema';
import { CpmService } from './cpm.service';
import { PlanningController } from './planning.controller';

@Module({
  imports: [
    TasksModule,
    DependenciesModule,
    WorkspacesModule,
    MongooseModule.forFeature([
      { name: PlanningSnapshot.name, schema: PlanningSnapshotSchema },
    ]),
  ],
  providers: [CpmService],
  controllers: [PlanningController],
  exports: [CpmService],
})
export class PlanningModule {}
