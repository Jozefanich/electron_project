const {contextBridge, ipcRenderer, webUtils} = require("electron");

contextBridge.exposeInMainWorld('eventer', {
    readFile: (path)=>ipcRenderer.invoke('reader',path),
    createFile:(text, path)=>ipcRenderer.send('creator', (text, path)),
    // onResponce:(callback)=>ipcRenderer.on('request', (event, data)=>{callback(data)}),
    saveFile:(text)=>ipcRenderer.invoke('save_file', (text))
});