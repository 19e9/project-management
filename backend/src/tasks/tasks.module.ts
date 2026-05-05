import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { Task, TaskSchema } from './schemas/task.schema';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';

@Module({
  imports: [
    WorkspacesModule,
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
  ],
  providers: [TasksService],
  controllers: [TasksController],
  exports: [TasksService, MongooseModule],
})
export class TasksModule {}
