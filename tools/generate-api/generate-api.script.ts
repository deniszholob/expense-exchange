// #region Imports
import { writeFile } from 'node:fs/promises';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../../.dist/server/server/app.module.js';
import { GENERATE_API_SCRIPT_CONFIG as CFG } from './generate-api.script.config.ts';
// #endregion

// #region OpenAPI Generation
const app = await NestFactory.create(AppModule, { logger: false });
try {
  app.setGlobalPrefix('api');
  const config = new DocumentBuilder()
    .setTitle(CFG.title)
    .setDescription(CFG.description)
    .setVersion(CFG.version)
    .build();
  const document = SwaggerModule.createDocument(app, config);
  await writeFile(CFG.outputFile, `${JSON.stringify(document, null, 2)}\n`);
} finally {
  await app.close();
}
// #endregion
