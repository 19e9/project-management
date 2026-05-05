import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';

@ApiBearerAuth()
@ApiTags('users')
@Controller('me')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  async me(@CurrentUser() user: JwtPayload) {
    const u = await this.users.getOrFail(user.sub);
    return {
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      platformRole: u.platformRole,
      timezone: u.timezone,
    };
  }
}
