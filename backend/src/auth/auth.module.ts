import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { GoogleOAuthEnabledGuard } from './guards/google-oauth-enabled.guard';
import {
  RefreshToken,
  RefreshTokenSchema,
} from './schemas/refresh-token.schema';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    MongooseModule.forFeature([
      { name: RefreshToken.name, schema: RefreshTokenSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: cfg.get<number>('JWT_ACCESS_EXPIRES_IN') },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, GoogleStrategy, GoogleOAuthEnabledGuard],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
