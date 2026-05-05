import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { JwtPayload } from '../decorators/current-user.decorator';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as JwtPayload | undefined;
    if (!user || user.platformRole !== 'platform_admin') {
      throw new ForbiddenException({
        code: 'NOT_PLATFORM_ADMIN',
        message: 'Platform admin role required.',
      });
    }
    return true;
  }
}
