import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as argon2 from 'argon2';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly users: Model<UserDocument>) {}

  /** Plain shape after `.lean()` — avoids TS2742 from mongodb internals. */
  async findById(id: string): Promise<{
    _id: Types.ObjectId;
    email: string;
    displayName: string;
    avatarUrl?: string;
    googleId?: string;
    platformRole: 'platform_admin' | 'user';
    timezone: string;
    isActive: boolean;
    authProviders?: string[];
    deletedAt?: Date;
    lastLoginAt?: Date;
  } | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.users.findById(id).lean();
    return doc ?? null;
  }

  findByEmail(email: string, includePassword = false) {
    const q = this.users.findOne({ email: email.toLowerCase(), deletedAt: { $exists: false } });
    if (includePassword) q.select('+passwordHash');
    return q.exec();
  }

  /** Also resolves soft-deleted users (for admin flows). */
  findByEmailIncludingDeleted(email: string, includePassword = false) {
    const q = this.users.findOne({ email: email.toLowerCase() });
    if (includePassword) q.select('+passwordHash');
    return q.exec();
  }

  findByGoogleId(googleId: string) {
    return this.users.findOne({ googleId, deletedAt: { $exists: false } }).exec();
  }

  async create(data: Partial<User>): Promise<UserDocument> {
    return this.users.create(data);
  }

  async getOrFail(id: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'USER_NOT_FOUND' });
    }
    const u = await this.users.findById(id);
    if (!u || u.deletedAt) throw new NotFoundException({ code: 'USER_NOT_FOUND' });
    return u;
  }

  assertEligibleForSession(user: UserDocument): void {
    if (!user.isActive || user.deletedAt) {
      throw new UnauthorizedException({ code: 'ACCOUNT_DISABLED', message: 'This account has been disabled.' });
    }
  }

  async touchLastLogin(userId: Types.ObjectId): Promise<void> {
    await this.users.updateOne({ _id: userId }, { $set: { lastLoginAt: new Date() } });
  }

  async adminSetPassword(userId: string, plainPassword: string): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException({ code: 'USER_NOT_FOUND' });
    }
    const passwordHash = await argon2.hash(plainPassword, { type: argon2.argon2id });
    const res = await this.users.updateOne(
      { _id: new Types.ObjectId(userId), deletedAt: { $exists: false } },
      {
        $set: { passwordHash },
        $addToSet: { authProviders: 'local' },
      },
    );
    if (res.matchedCount === 0) {
      throw new NotFoundException({ code: 'USER_NOT_FOUND' });
    }
  }
}
