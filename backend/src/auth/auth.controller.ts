import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { parseDurationMs } from '../common/utils/duration';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, body } = await this.auth.register(dto);
    if (token) this.setCookie(res, token);
    return body;
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, body } = await this.auth.login(dto);
    this.setCookie(res, token);
    return body;
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(this.cookieName(), this.baseCookieOptions());
  }

  @Get('me')
  me(@CurrentUser('id') userId: string) {
    return this.auth.getSession(userId);
  }

  private cookieName() {
    return this.config.getOrThrow<string>('COOKIE_NAME');
  }

  private baseCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get<string>('COOKIE_SECURE') === 'true',
      path: '/',
    };
  }

  private setCookie(res: Response, token: string) {
    res.cookie(this.cookieName(), token, {
      ...this.baseCookieOptions(),
      maxAge: parseDurationMs(this.config.getOrThrow<string>('JWT_EXPIRES_IN')),
    });
  }
}