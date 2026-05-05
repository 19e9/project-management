import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import {
  ResourceAllocation,
  ResourceAllocationSchema,
} from './schemas/resource-allocation.schema';
import { ResourcesService } from './resources.service';
import { ResourcesController } from './resources.controller';

@Module({
  imports: [
    WorkspacesModule,
    MongooseModule.forFeature([
      { name: ResourceAllocation.name, schema: ResourceAllocationSchema },
    ]),
  ],
  providers: [ResourcesService],
  controllers: [ResourcesController],
  exports: [ResourcesService, MongooseModule],
})
export class ResourcesModule {}
