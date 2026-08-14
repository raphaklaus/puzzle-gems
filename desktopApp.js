import { app, BrowserWindow } from 'electron';

function createWindow() {
    const win = new BrowserWindow({
        fullscreen: true,       // Tela cheia
        autoHideMenuBar: true,  // Oculta o menu
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    win.loadFile('dist/index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});