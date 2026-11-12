// #region Imports
import { app, BrowserWindow } from 'electron';
import { join } from 'node:path';
// #endregion

// #region Window
function createWindow(): void {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  void window.loadFile(
    join(import.meta.dirname, '../client/browser/index.html'),
  );
}
// #endregion

// #region Lifecycle
void app.whenReady().then((): void => {
  createWindow();
  app.on('activate', (): void => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', (): void => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
// #endregion
