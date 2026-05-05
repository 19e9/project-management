import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import {
  TaskDependency,
  TaskDependencySchema,
} from './schemas/task-dependency.schema';
import { DependenciesService } from './dependencies.service';
import { DependenciesController } from './dependencies.controller';

@Module({
  imports: [
    WorkspacesModule,
    MongooseModule.forFeature([
      { name: TaskDependency.name, schema: TaskDependencySchema },
    ]),
  ],
  providers: [DependenciesService],
  controllers: [DependenciesController],
  exports: [DependenciesService, MongooseModule],
})
export class DependenciesModule {}
