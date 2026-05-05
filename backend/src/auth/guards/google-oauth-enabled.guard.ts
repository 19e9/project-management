import {
  Injectable,
  ServiceUnavailableException,
  CanActivate,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Blocks Google OAuth routes when credentials are not configured. */
@Injectable()
export class GoogleOAuthEnabledGuard implements CanActivate {
  constructor(private readonly cfg: ConfigService) {}

  canActivate(): boolean {
    const id = this.cfg.get<string>('GOOGLE_CLIENT_ID')?.trim();
    const secret = this.cfg.get<string>('GOOGLE_CLIENT_SECRET')?.trim();
    if (!id || !secret) {
      throw new ServiceUnavailableException({
        code: 'GOOGLE_OAUTH_NOT_CONFIGURED',
        message:
          'Google sign-in is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment.',
      });
    }
    return true;
  }
}
