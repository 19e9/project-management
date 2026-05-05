import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
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
  } | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.users.findById(id).lean();
    return doc ?? null;
  }

  findByEmail(email: string, includePassword = false) {
    const q = this.users.findOne({ email: email.toLowerCase() });
    if (includePassword) q.select('+passwordHash');
    return q.exec();
  }

  findByGoogleId(googleId: string) {
    return this.users.findOne({ googleId }).exec();
  }

  async create(data: Partial<User>): Promise<UserDocument> {
    return this.users.create(data);
  }

  async getOrFail(id: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'USER_NOT_FOUND' });
    }
    const u = await this.users.findById(id);
    if (!u) throw new NotFoundException({ code: 'USER_NOT_FOUND' });
    return u;
  }
}
