import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = 'Internal server error';
    let code: string | undefined;
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const r = exception.getResponse();
      if (typeof r === 'string') {
        message = r;
      } else if (r && typeof r === 'object') {
        const obj = r as Record<string, unknown>;
        message = (obj.message as string) ?? message;
        code = obj.code as string | undefined;
        details = obj.details;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(exception.stack ?? exception.message);
    }

    res.status(status).json({
      statusCode: status,
      error: HttpStatus[status] ?? 'Error',
      message,
      code,
      details,
      path: req.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }
}
