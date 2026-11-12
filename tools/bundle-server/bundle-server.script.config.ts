// #region Configuration
export const BUNDLE_SERVER_SCRIPT_CONFIG = {
  outputDirectory: '.dist/server-bundle',
  entryPoint: '.dist/server/server/main.js',
  externalPackages: [
    '@fastify/static',
    '@nestjs/microservices',
    '@nestjs/microservices/*',
    '@nestjs/websockets/*',
    'class-transformer',
    'class-validator',
  ],
  swaggerUiDirectoryName: 'swagger-ui',
} as const;
// #endregion
