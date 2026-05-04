const { app, BrowserWindow, ipcMain, dialog} = require('electron');
const path = require('node:path');
const fs = require('node:fs').promises;
let win;

async function save_dialog(defaultName='table.csv'){
    const { filePath, canceled } = await dialog.showSaveDialog({
        title: 'Select place to save this file',
        defaultPath: defaultName,
        buttonLabel: 'Save',
        filters: [
            {name: 'CSV files', extensions: ['csv']},
            {name: 'All files', extensions: ['*']}
        ]
    });
    return canceled ? null : filePath;
}

async function open_dialog(){
    const {canceled, filePaths} = await dialog.showOpenDialog({
        title: 'Select file',
        buttonLabel: 'Open',
        properties: ['openFile'],
        filters: [
            {name: 'CSV files', extensions: ['csv']},
            {name: 'All files', extensions: ['*']}
        ]
    });
    return canceled ? null : filePaths[0];
}




function write_file(path, text){
    return new Promise((resolve, reject)=>{
        try{
            fs.writeFile(path, text).then(resolve('OK'));
        }
        catch(err){
            console.log(err);
            reject(`ERROR: ${err}`);
        }
    })
}



ipcMain.handle('reader', async()=>{
    let path = await open_dialog();
    if(path){
        let rowCount=0;
        let colCount=0;
        try{
            let text = await fs.readFile(path, "utf-8");
            let splitedText = text.split('\n');
            rowCount = splitedText.length;
            colCount = splitedText[0].split(';').length;
            text = [];
            splitedText.forEach(elem=>{
                text.push(`<tr><td>${elem.replaceAll(';','</td><td>')}</td></tr>`);
            });
            text = `<table><tbody>${text.join('\n')}</tbody></table>`;
            let result = {'body': text, 'params':{'colCount':colCount, 'rowCount':rowCount}, 'code':'OK'};
            return result;
        }
        catch(error){
            return {'body':`something went wrong\n${error}`, 'code':'ERROR'};
        }
    }
    else{
        return {'body':"ERROR! No file",'code':'ERROR'};
    }
});

ipcMain.handle('save_file', async(event, text)=>{
    save_dialog()
    .then(path=>{
        if(path)write_file(path, text).then(result=>console.log(result));
    })
})


ipcMain.on('creator', async(event,text, path)=>{
    console.log(text);
    let result="";
    let lines=[];
    let obj = JSON.parse(text);
    for(let line of obj){
        lines.push(line.row.join(';'));
    }
    result = lines.join('\n');
    console.log(result);
    try{
        fs.writeFile(path + '/file.csv', result);
    }
    catch(error){
        console.log(error);
    }
    // event.reply('request', 'success');
});


const createWindow = () => {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences:{
            preload: path.join(app.getAppPath(),"preload.js")
        }
    });
    win.loadFile('index.html');
};

app.on("ready",() => {
  createWindow();
})