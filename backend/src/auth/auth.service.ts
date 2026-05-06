import {
  ConflictException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as argon2 from 'argon2';
import { randomBytes, createHash } from 'crypto';
import { Model, Types } from 'mongoose';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import {
  RefreshToken,
  RefreshTokenDocument,
} from './schemas/refresh-token.schema';

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly cfg: ConfigService,
    @InjectModel(RefreshToken.name)
    private readonly refreshes: Model<RefreshTokenDocument>,
  ) {}

  async register(dto: RegisterDto): Promise<IssuedTokens> {
    if (this.cfg.get<boolean>('MAINTENANCE_MODE')) {
      throw new ServiceUnavailableException({
        code: 'MAINTENANCE',
        message: 'Platform maintenance — registration is temporarily disabled.',
      });
    }
    if (!this.cfg.get<boolean>('OPEN_REGISTRATION')) {
      throw new ForbiddenException({
        code: 'REGISTRATION_CLOSED',
        message: 'New sign-ups are disabled on this deployment.',
      });
    }
    const existing = await this.users.findByEmailIncludingDeleted(dto.email);
    if (existing?.deletedAt) {
      throw new ConflictException({
        code: 'EMAIL_UNAVAILABLE',
        message: 'This email belongs to a removed account.',
      });
    }
    if (existing) {
      throw new ConflictException({ code: 'EMAIL_TAKEN' });
    }
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });
    const user = await this.users.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      displayName: dto.displayName,
      authProviders: ['local'],
    });
    return this.issueSession(user);
  }

  async login(dto: LoginDto): Promise<IssuedTokens> {
    const user = await this.users.findByEmailIncludingDeleted(dto.email, true);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS' });
    }
    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS' });
    }
    return this.issueSession(user);
  }

  async refresh(rawRefreshToken: string): Promise<IssuedTokens> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const stored = await this.refreshes.findOne({ tokenHash });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException({ code: 'REFRESH_INVALID' });
    }
    const user = await this.users.getOrFail(String(stored.userId));
    stored.revoked = true;
    await stored.save();
    return this.issueSession(user, String(stored._id));
  }

  async logoutAll(userId: string) {
    await this.refreshes.updateMany(
      { userId: new Types.ObjectId(userId), revoked: false },
      { $set: { revoked: true } },
    );
  }

  async issueSession(
    user: UserDocument,
    replacedBy?: string,
  ): Promise<IssuedTokens> {
    this.users.assertEligibleForSession(user);
    const accessExpiresIn = this.cfg.get<number>('JWT_ACCESS_EXPIRES_IN')!;
    const refreshExpiresIn = this.cfg.get<number>('JWT_REFRESH_EXPIRES_IN')!;
    const accessToken = await this.jwt.signAsync(
      {
        sub: String(user._id),
        email: user.email,
        platformRole: user.platformRole,
      },
      {
        secret: this.cfg.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessExpiresIn,
      },
    );
    const refreshToken = randomBytes(48).toString('base64url');
    const tokenHash = this.hashToken(refreshToken);
    const created = await this.refreshes.create({
      userId: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + refreshExpiresIn * 1000),
      replacedBy,
    });
    if (replacedBy) {
      await this.refreshes.updateOne(
        { _id: replacedBy },
        { $set: { replacedBy: String(created._id) } },
      );
    }
    await this.users.touchLastLogin(user._id);
    return {
      accessToken,
      refreshToken,
      expiresIn: accessExpiresIn,
    };
  }

  async findOrCreateGoogleUser(profile: {
    googleId: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
  }) {
    let user = await this.users.findByGoogleId(profile.googleId);
    if (user) return user;
    user = (await this.users.findByEmailIncludingDeleted(profile.email)) ?? null;
    if (user) {
      if (user.deletedAt) {
        throw new UnauthorizedException({
          code: 'ACCOUNT_REMOVED',
          message: 'This account has been removed.',
        });
      }
      user.googleId = profile.googleId;
      if (!user.authProviders.includes('google')) {
        user.authProviders.push('google');
      }
      if (!user.avatarUrl && profile.avatarUrl) user.avatarUrl = profile.avatarUrl;
      await user.save();
      return user;
    }
    return this.users.create({
      email: profile.email.toLowerCase(),
      displayName: profile.displayName,
      googleId: profile.googleId,
      avatarUrl: profile.avatarUrl,
      authProviders: ['google'],
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
