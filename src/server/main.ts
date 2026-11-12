// #region Imports
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { extname, resolve } from 'node:path';
import type { NextFunction, Request, Response } from 'express';

import { AppModule } from './app.module.js';
// #endregion

// #region Bootstrap
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  const distributionDirectory = process.env['DIST_DIR'] ?? '.dist';
  const clientDirectory = resolve(distributionDirectory, 'client/browser');
  app.useStaticAssets(clientDirectory);
  app.use((request: Request, response: Response, next: NextFunction): void => {
    const requestPath = new URL(request.originalUrl, 'http://localhost')
      .pathname;
    const isClientNavigation =
      (request.method === 'GET' || request.method === 'HEAD') &&
      extname(requestPath) === '' &&
      requestPath !== '/api' &&
      !requestPath.startsWith('/api/');

    if (!isClientNavigation) {
      next();
      return;
    }

    response.sendFile(
      'index.html',
      { root: clientDirectory },
      (error: Error): void => {
        if (error && !response.headersSent) next(error);
      },
    );
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Expense Exchange API')
    .setDescription('Self-hosted Expense Exchange API')
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSwaggerUiPath: resolve(
      distributionDirectory,
      'server-bundle/swagger-ui',
    ),
    jsonDocumentUrl: 'api/openapi.json',
  });

  const port = Number(process.env['PORT'] ?? 3000);
  await app.listen(port, '0.0.0.0');

  const logger = new Logger('Bootstrap');
  const localUrl = `http://localhost:${port}`;
  const apiMethods = [
    'get',
    'post',
    'put',
    'patch',
    'delete',
    'options',
    'head',
  ] as const;
  const apiRoutes = Object.entries(document.paths).flatMap(
    ([routePath, pathItem]) =>
      apiMethods.flatMap((method) =>
        pathItem[method] === undefined
          ? []
          : [`${method.toUpperCase()} ${routePath}`],
      ),
  );

  logger.log(
    `API routes:\n${[
      'GET /api (redirects to API docs)',
      ...apiRoutes,
      'GET /api/openapi.json',
      'GET /api/docs',
    ]
      .map((route) => `  ${route}`)
      .join('\n')}`,
  );

  logger.log(`UI: ${localUrl}/`);
  logger.log(`API: ${localUrl}/api`);
}

void bootstrap();
// #endregion
