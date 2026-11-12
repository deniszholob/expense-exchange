// #region Configuration
export const DOCKER_SMOKE_SCRIPT_CONFIG = {
  containerName: 'expense-exchange-validation',
  host: '127.0.0.1',
  hostPort: '4310',
  containerPort: '3000',
  dataMount: 'type=tmpfs,destination=/app/data',
  healthPath: '/api/health',
  uiPath: '/',
  applicationIconPath: '/assets/expense-exchange-icon.png',
  swaggerPath: '/api/docs',
  openApiPath: '/api/openapi.json',
} as const;
// #endregion
