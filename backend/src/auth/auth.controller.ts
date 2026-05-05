import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { UserDocument } from '../users/schemas/user.schema';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { AuthService, IssuedTokens } from './auth.service';
import { LoginDto, RegisterDto, RefreshDto } from './dto/auth.dto';
import { GoogleOAuthEnabledGuard } from './guards/google-oauth-enabled.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cfg: ConfigService,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<IssuedTokens> {
    return this.auth.register(dto);
  }

  @Public()
  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: LoginDto): Promise<IssuedTokens> {
    return this.auth.login(dto);
  }

  @Public()
  @HttpCode(200)
  @Post('refresh')
  async refresh(@Body() dto: RefreshDto): Promise<IssuedTokens> {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  async logout(@CurrentUser() user: JwtPayload) {
    await this.auth.logoutAll(user.sub);
    return { ok: true };
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleOAuthEnabledGuard, AuthGuard('google'))
  googleStart() {
    /* Passport handles redirect */
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleOAuthEnabledGuard, AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as UserDocument;
    const session = await this.auth.issueSession(user);
    const origin = (this.cfg.get<string>('CORS_ORIGIN') ?? 'http://localhost:5173').split(
      ',',
    )[0];
    const redirect = `${origin}/auth/callback#access=${encodeURIComponent(
      session.accessToken,
    )}&refresh=${encodeURIComponent(session.refreshToken)}`;
    return res.redirect(redirect);
  }
}
