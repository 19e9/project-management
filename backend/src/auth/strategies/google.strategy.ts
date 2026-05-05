import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(cfg: ConfigService, private readonly auth: AuthService) {
    // Empty .env values are '' — `??` does not replace them, and Passport rejects falsy clientID.
    // Dummy non-empty strings allow the app to boot; routes are gated by GoogleOAuthEnabledGuard.
    const clientID =
      cfg.get<string>('GOOGLE_CLIENT_ID')?.trim() || '__google_oauth_disabled__';
    const clientSecret =
      cfg.get<string>('GOOGLE_CLIENT_SECRET')?.trim() ||
      '__google_oauth_disabled__';
    super({
      clientID,
      clientSecret,
      callbackURL: cfg.get<string>('GOOGLE_CALLBACK_URL')!,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error('Google profile missing email'), undefined);
      const user = await this.auth.findOrCreateGoogleUser({
        googleId: profile.id,
        email,
        displayName: profile.displayName ?? email.split('@')[0],
        avatarUrl: profile.photos?.[0]?.value,
      });
      done(null, user);
    } catch (err) {
      this.logger.error(err);
      done(err as Error, undefined);
    }
  }
}
