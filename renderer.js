let save = document.getElementById('saveFile');
let create_table = document.getElementById('create');

let container = document.getElementById('container');
// let doc = document.getElementById('csvfile');

let btn = document.getElementById('reader');

let loader = document.getElementById('loadLast');


let colAdd = document.getElementById('colAdd');
let colRm = document.getElementById('colRm');

let rowAdd = document.getElementById('rowAdd');
let rowRm = document.getElementById('rowRm');

let last_target = null;
let message_option = true;
let path = null;

let colCount=0;
let rowCount=0;




let dlg = document.getElementById('dialog');
document.getElementById('option_OK').onclick = ()=>dlg.close('OK');
document.getElementById('option_NO').onclick = ()=>dlg.close('NO');


create_table.onclick=()=>{
    container.innerHTML = "<table><tbody><tr><td>col-1</td><td>col-2</td></tr><tr><td>row-1</td><td>row-1</td></tr><tr><td>row-2</td><td>row-2</td></tr></tbody></table>";
    colCount=2;
    rowCount=3
    set_table_event();
}


function remind(text = 'You can`t do this'){
    let remindDlg = document.getElementById('remindError');
    remindDlg.firstElementChild.innerText=text;
    remindDlg.showModal();
    document.getElementById('close_remind').onclick=()=>{remindDlg.close()};
}


function set_table_event(){ // при створенні табиці додється можливість редагувати результат одразу в таблиці
    container.firstChild.onclick = (event)=>{
        let selector = event.target.closest('td');
        if(!selector)return;
        selector.contentEditable = 'true';
        selector.addEventListener('blur',()=>{
            if(selector.innerText.replaceAll('\n', '').trim() == ''){
                remind('empty field');
                selector.innerText= 'null';
            }
            selector.contentEditable = 'false';
        },{once:true});
        last_target = selector;
    }
    document.getElementById('saveFile').style.display = 'inline';
}


function request(text){
    let dialog = document.getElementById('dialog');
    dialog.firstElementChild.innerText = text;
    dialog.showModal();
    return new Promise((resolve)=>{
        dialog.onclose = ()=>{
            resolve(dialog.returnValue);
        };
    });
}


function parseTableInfo(){ // парсить таблицю на json строку
    let table = container.lastElementChild.lastElementChild.children;
    return new Promise((resp)=>{
        let parsed_table=[];
        for(let row of table){
            let line = [];
            let row_items = row.children;
            for(let item of row_items){
                line.push(item.innerText);
            }
            parsed_table.push(line.join(';'));
        }   
        resp(parsed_table.join('\n'));
    });
    // return new Promise((resp)=>{
    //     line_obj=[];
    //     for(let row of table){
    //         let line = [];
    //         let row_items = row.children;
    //         for(let item of row_items){
    //             line.push(item.innerText);
    //         }
    //         line_obj.push({row:line});
    //     }   
    //     resp(JSON.stringify(line_obj));
    // });
}


// window.eventer.onResponce((responce)=>{
//     document.body.insertAdjacentHTML('afterbegin', `<div class="msg">${responce}</div>`);
//     let msg = document.getElementsByClassName('msg')[0];
//     setTimeout(() => {
//         msg.classList.add('hide');
//         msg.addEventListener('transitionend',()=>{msg.remove();},{once:true});
//     },5000);
// });


document.getElementById('input').addEventListener('click',async()=>{
    if(container.innerText != ''){
        if(await request('save last changes?') == 'OK'){
            await parseTableInfo().then(data=>window.eventer.saveFile(data));
        }
    }
    container.innerHTML = '';
    let result = await window.eventer.readFile(); // отримання вмісту файлу
    if(result['code']=='OK'){ // якщо все добре то вівід та збереження 
        colCount=result['params']['colCount'];
        rowCount=result['params']['rowCount'];
        container.insertAdjacentHTML('beforeend',result['body']);
        set_table_event();
        localStorage.setItem('lastRequest', JSON.stringify(result));
    }
    else{ // якщо сталася помилка то повідомляє про це користувача
        remind(result['body']);
        colCount=0;
        rowCount=0;
        container.innerHTML="";
    }
})


save.onclick = ()=>{
    parseTableInfo().then(data=>window.eventer.saveFile(data));
}


rowAdd.addEventListener('click', ()=>{ // створює новий рядок в кінці таблиці
    let tabItem = container.lastElementChild.lastElementChild;
    if(colCount==0){
        remind();
        return;
    }
    let newRow = "<tr>";
    for(let i=0; i<colCount; ++i){
        newRow += '<td>null</td>';
    }
    newRow += '</tr>';
    tabItem.insertAdjacentHTML('beforeend', newRow);
    rowCount+=1;

});

rowRm.addEventListener('click', async()=>{ // видаляє останній рядок таблиці
    let tabItem = container.lastElementChild.lastElementChild;
    if(rowCount<2){
        remind();
        return;
    }
    if(await request('Are you sure want to delete last row?') == 'OK'){
        tabItem.deleteRow(-1);
        rowCount-=1;
    }
});

colAdd.addEventListener('click', ()=>{ // створює новий стовбець 
    let tabItem = container.lastElementChild.lastElementChild;
    if(rowCount==0){
        remind();
        return;
    }
    let items = tabItem.children;
    for(let item of items){
        item.insertAdjacentHTML('beforeend', '<td>null</td>');
    }
    colCount+=1;
});
colRm.addEventListener('click', async()=>{ // видаляє останній стовбець
    let tabItem = container.lastElementChild.lastElementChild;
    if(colCount<2){
        remind();
        return;
    }
    if(await request('Are you sure want to delete last column?') == 'OK'){
        let items = tabItem.children;
        for(let item of items){
            item.lastElementChild.remove();
        }
        colCount-=1;
    }
});

loader.addEventListener('click',async()=>{ // завантаження з локального сховища
    let result = localStorage.getItem('lastRequest');
    if(!result){
        remind('No loaded table before');
        return;
    }
    if(container.innerText != ''){
        if(await request('save last changes?') == 'OK'){
            parseTableInfo().then(data=>window.eventer.saveFile(data));
        }
    }
    result = JSON.parse(result);
    colCount=result['params']['colCount'];
    rowCount=result['params']['rowCount'];
    container.innerHTML="";
    container.insertAdjacentHTML('beforeend',result['body']);
    set_table_event();
    localStorage.setItem('lastRequest', JSON.stringify(result));
});