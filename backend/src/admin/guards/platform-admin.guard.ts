import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  constructor(
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const userId: string | undefined = req.user?.sub;
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new ForbiddenException({ code: 'FORBIDDEN' });
    }
    // Trust DB over JWT for this elevated role (revocation-safe).
    const user = await this.users
      .findById(userId)
      .select('platformRole isActive')
      .lean();
    if (!user || !user.isActive || user.platformRole !== 'platform_admin') {
      throw new ForbiddenException({
        code: 'NOT_PLATFORM_ADMIN',
        message: 'Platform admin role required',
      });
    }
    return true;
  }
}
