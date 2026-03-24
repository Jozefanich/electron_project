const { app, BrowserWindow } = require('electron');

let win;

const createWindow = () => {
    win = new BrowserWindow({
        width: 800,
        height: 600
    });
    win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();
})