// #region Imports
import { execFileSync } from 'node:child_process';
import { DOCKER_SMOKE_SCRIPT_CONFIG as CFG } from './docker-smoke.script.config.ts';
// #endregion

// #region Constants
const IMAGE_NAME = `expense-exchange:${process.env['npm_package_version'] ?? '0.1.0'}`;
const BASE_URL = `http://${CFG.host}:${CFG.hostPort}`;
// #endregion

// #region Main
let containerStarted = false;

try {
  execFileSync(
    'docker',
    [
      'run',
      '--detach',
      '--name',
      CFG.containerName,
      '--publish',
      `${CFG.host}:${CFG.hostPort}:${CFG.containerPort}`,
      '--mount',
      CFG.dataMount,
      IMAGE_NAME,
    ],
    { stdio: 'inherit' },
  );
  containerStarted = true;

  let healthResponse: Response | undefined;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      healthResponse = await fetch(`${BASE_URL}${CFG.healthPath}`);
      if (healthResponse.ok) {
        break;
      }
    } catch {
      healthResponse = undefined;
    }
    if (!healthResponse?.ok) {
      await new Promise<void>((resolve): void => {
        setTimeout(resolve, 1000);
      });
    }
  }

  if (!healthResponse?.ok) {
    throw new Error('Docker API health check failed.');
  }
  console.info(`API health: ${await healthResponse.text()}`);

  const uiResponse = await fetch(`${BASE_URL}${CFG.uiPath}`);
  if (!uiResponse.ok) {
    throw new Error(`UI returned HTTP ${uiResponse.status}.`);
  }
  console.info(`UI HTTP ${uiResponse.status}`);

  const iconResponse = await fetch(`${BASE_URL}${CFG.applicationIconPath}`);
  if (!iconResponse.ok) {
    throw new Error(`Application icon returned HTTP ${iconResponse.status}.`);
  }
  console.info(`Application icon HTTP ${iconResponse.status}`);

  const docsResponse = await fetch(`${BASE_URL}${CFG.swaggerPath}`);
  if (!docsResponse.ok) {
    throw new Error(`API docs returned HTTP ${docsResponse.status}.`);
  }
  console.info(`API docs HTTP ${docsResponse.status}`);

  const openApiResponse = await fetch(`${BASE_URL}${CFG.openApiPath}`);
  if (!openApiResponse.ok) {
    throw new Error(`OpenAPI JSON returned HTTP ${openApiResponse.status}.`);
  }
  console.info(`OpenAPI JSON HTTP ${openApiResponse.status}`);
} finally {
  if (containerStarted) {
    execFileSync('docker', ['stop', CFG.containerName], { stdio: 'inherit' });
    execFileSync('docker', ['rm', CFG.containerName], { stdio: 'inherit' });
  }
}
// #endregion
