import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument } from '../tasks/schemas/task.schema';
import { Project, ProjectDocument } from './schemas/project.schema';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import {
  Workspace,
  WorkspaceDocument,
} from '../workspaces/schemas/workspace.schema';

interface WorkspaceActor {
  userId: string;
  workspaceRole?: 'owner' | 'admin' | 'member' | 'viewer' | 'client';
  platformOverride?: boolean;
}

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private readonly projects: Model<ProjectDocument>,
    @InjectModel(Task.name) private readonly tasks: Model<TaskDocument>,
    @InjectModel(Workspace.name)
    private readonly workspaces: Model<WorkspaceDocument>,
  ) {}

  async create(workspaceId: string, dto: CreateProjectDto, actor?: WorkspaceActor) {
    this.assertOwner(actor);
    const ws = await this.workspaces.findById(workspaceId);
    if (!ws) throw new NotFoundException({ code: 'WORKSPACE_NOT_FOUND' });

    const count = await this.projects.countDocuments({
      workspaceId: ws._id,
      status: 'active',
    });
    if (count >= ws.entitlements.maxProjects) {
      throw new BadRequestException({
        code: 'PLAN_LIMIT',
        message: 'Project limit reached for current plan',
      });
    }

    const created = await this.projects.create({
      workspaceId: ws._id,
      ...dto,
    });
    return this.shape(created.toObject());
  }

  async list(workspaceId: string, actor?: WorkspaceActor) {
    const projectFilter: any = {
      workspaceId: new Types.ObjectId(workspaceId),
      status: 'active',
    };
    if (!this.canSeeWorkspaceWide(actor)) {
      projectFilter._id = {
        $in: await this.visibleProjectIdsForActor(workspaceId, actor),
      };
    }
    const items = await this.projects
      .find(projectFilter)
      .sort({ createdAt: -1 })
      .lean();
    return items.map((i) => this.shape(i));
  }

  async getOrFail(workspaceId: string, projectId: string, actor?: WorkspaceActor) {
    if (!Types.ObjectId.isValid(projectId)) {
      throw new NotFoundException({ code: 'PROJECT_NOT_FOUND' });
    }
    const p = await this.projects
      .findOne({
        _id: new Types.ObjectId(projectId),
        workspaceId: new Types.ObjectId(workspaceId),
        status: 'active',
      })
      .lean();
    if (!p) throw new NotFoundException({ code: 'PROJECT_NOT_FOUND' });
    if (!this.canSeeWorkspaceWide(actor)) {
      const hasAccess = await this.actorCanSeeProject(workspaceId, projectId, actor);
      if (!hasAccess) throw new NotFoundException({ code: 'PROJECT_NOT_FOUND' });
    }
    return this.shape(p);
  }

  async update(workspaceId: string, projectId: string, dto: UpdateProjectDto, actor?: WorkspaceActor) {
    this.assertOwner(actor);
    const p = await this.projects
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(projectId),
          workspaceId: new Types.ObjectId(workspaceId),
        },
        dto,
        { new: true },
      )
      .lean();
    if (!p) throw new NotFoundException({ code: 'PROJECT_NOT_FOUND' });
    return this.shape(p);
  }

  async archive(workspaceId: string, projectId: string, actor?: WorkspaceActor) {
    return this.update(workspaceId, projectId, { status: 'archived' }, actor);
  }

  private canSeeWorkspaceWide(actor?: WorkspaceActor) {
    return actor?.platformOverride || actor?.workspaceRole === 'owner' || actor?.workspaceRole === 'admin';
  }

  private async visibleProjectIdsForActor(workspaceId: string, actor?: WorkspaceActor) {
    if (!actor?.userId) return [];
    const workspaceObjectId = new Types.ObjectId(workspaceId);
    const userObjectId = new Types.ObjectId(actor.userId);
    const [leadProjectIds, taskProjectIds] = await Promise.all([
      this.projects.distinct('_id', {
        workspaceId: workspaceObjectId,
        status: 'active',
        leadId: userObjectId,
      }),
      this.tasks.distinct('projectId', {
        workspaceId: workspaceObjectId,
        assigneeIds: userObjectId,
      }),
    ]);
    return Array.from(new Set([...leadProjectIds, ...taskProjectIds].map((id) => String(id)))).map(
      (id) => new Types.ObjectId(id),
    );
  }

  private async actorCanSeeProject(workspaceId: string, projectId: string, actor?: WorkspaceActor) {
    if (!actor?.userId) return false;
    const workspaceObjectId = new Types.ObjectId(workspaceId);
    const projectObjectId = new Types.ObjectId(projectId);
    const userObjectId = new Types.ObjectId(actor.userId);
    const [leadProject, assignedTaskCount] = await Promise.all([
      this.projects.exists({
        _id: projectObjectId,
        workspaceId: workspaceObjectId,
        status: 'active',
        leadId: userObjectId,
      }),
      this.tasks.countDocuments({
        workspaceId: workspaceObjectId,
        projectId: projectObjectId,
        assigneeIds: userObjectId,
      }),
    ]);
    return !!leadProject || assignedTaskCount > 0;
  }

  private assertOwner(actor?: WorkspaceActor) {
    if (!this.canSeeWorkspaceWide(actor)) {
      throw new ForbiddenException({
        code: 'OWNER_REQUIRED',
        message: 'Only workspace owners and admins can manage projects.',
      });
    }
  }

  private shape(p: any) {
    return {
      id: String(p._id),
      workspaceId: String(p.workspaceId),
      name: p.name,
      description: p.description ?? null,
      code: p.code ?? null,
      leadId: p.leadId ? String(p.leadId) : null,
      status: p.status,
      startDate: p.startDate ?? null,
      endDate: p.endDate ?? null,
      createdAt: p.createdAt,
    };
  }
}
