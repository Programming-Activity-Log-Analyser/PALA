var supportedArchiveTypes=['application/x-zip-compressed'
                            ,'application/zip'
                            ,'application/x-tar'
                            ,'application/x-7z-compressed'
                            ,'application/x-rar-compressed'];

var files=[];
var modalJsonLog=[];
var logCacheInterval=50;
var errorAnalysing=[];

var chart;

$(function() {
    console.log( "ready!" );

    addListeners();

    $('[data-toggle="popover"]').popover({
        trigger: 'focus'
      }); 

});
 

/** adds listeners to html elements
 * 
 *  */ 
function addListeners(){
    $("#log-button").click(fileSubmit); //clicked on analyse button
    $("#input-log-type").change(toggleLogArea); //toggled file input
    $(".log-input").change(showLogInputData); //file or folder chosen then shown in log input area
    $("#expand-choose-logs").click(toggleChooseLogs); 
    $('#sidebarCollapse').click(toggleSidebar);
    $('#replayerModal').on('shown.bs.modal', replayerOnShown); //This event is fired when the modal has been made visible to the user 
    $('#replayerModal').on('hide.bs.modal', replayerOnHide);   //This event is fired immediately when the hide instance method has been called.
    $('#replayerModal').on('hidden.bs.modal', replayerOnHidden); //This event is fired when the modal has finished being hidden from the user (will wait for CSS transitions to complete).
    $('#modal-sidebar-event-list').on('keydown', onKeyDown); //allows to move around with arrow keys   #log-analysis-groups
    $('#textGraphModal').on('hidden.bs.modal', textGraphOnHidden); //This event is fired when the modal has finished being hidden from the user (will wait for CSS transitions to complete).
}


/** destroys created chart
 * 
 */
function textGraphOnHidden(){
    chart.destroy();
}


/** This event is fired when the modal has been made visible to the user 
 *  Make first element in event list active
 */
function replayerOnShown(){
    $('#event-list-row-0').focus();   
}


/** This event is fired immediately when the hide instance method has been called.
 *  Event list will be scrolled back to top
 */
function replayerOnHide(){
    $('#modal-sidebar-event-list').scrollTop(0);
}


/** This event is fired when the modal has finished being hidden from the user (will wait for CSS transitions to complete).
 * 
 */
function replayerOnHidden(){
    modalJsonLog=[];
    $('#modal-sidebar-event-list').empty();  //eemaldame kirjed replayerist
    $("#modal-sidebar-event-data-list").empty();
    $("#modal-main-header").empty();
    $("#modal-program-text").empty();
    $("#modal-shell-text").empty();
}


/**
 * toggles sidebar
 */
function toggleSidebar(){
    $('.sidebar, .content').toggleClass('active');
}

/**
 * displays sidebar
 */
function showSidebar(){
    $('.sidebar, .content').addClass('active');

}

/** toggles log choosing area
 * 
 */
function toggleChooseLogs(){

    var goToTop=!$("#choose-logs").hasClass("show");

    $("#choose-logs").collapse('toggle');

    if (goToTop){
        $(window).scrollTop(0);
    }
    
}

/** shows text of how many files chosen
 * 
 */
function showLogInputData(){
    var logTypeFile=$("#input-log-type")[0].checked;
    var lenFiles=$(this)[0].files.length;

    if(logTypeFile){//file
        $("#log-input-file-msg").text(lenFiles+' files chosen.');
    }else{//folder
        $("#log-input-folder-msg").text(lenFiles+' files present in selected folder.');
    }
}

/**switches list item
 * 
 */
function switchListItem(keyEvent){
    if (keyEvent.code=="Tab" || keyEvent.type=="click"){
        if ($("#input-analysis-type")[0].checked){ //Multiple student analysis
            $('.failid.active').removeClass('active');   
        }
        $(".tab-pane.active").removeClass('active show');   
        
        if (keyEvent.code=="Tab"){
            $(this).tab('show');
        }
    }
}


/** scroll replayer event rows with arrow keys
 * 
 */
function onKeyDown(keyEvent){
    if(["ArrowUp","ArrowDown"].indexOf(keyEvent.code) > -1) {
        keyEvent.preventDefault();
        if(keyEvent.code=="ArrowUp"){
            $(".event-list-row.active").prev().focus();
        }else if(keyEvent.code=="ArrowDown"){
            $(".event-list-row.active").next().focus();
        }
    }
} 


/** switch between grouped log file folders in analysed files
 * 
 */
function switchFolder(keyEvent){
    if (keyEvent.code=="Tab"){
        $(this).click();
    }
}

/**
 * toggle file input and text inside based on file input checkbox
 */
function toggleLogArea(){
    $(".log-input-msg").toggleClass('d-none');
    $(".log-input").toggleClass('d-none');

}

/**
 * clear previously analysed results
 */
function clearAnalysisResults(){
    $('#log-analysis-groups').children().remove();
    $('#log-analysis-results').children().remove();
}

/**
 * Analyse button was clicked
 */
function fileSubmit(){
    var logTypeFile=$("#input-log-type")[0].checked;

    if( logTypeFile){ //File input
        var logInput = $("#file-input");
    }else{ //Folder input
        var logInput = $("#folder-input");
    }

    if( logInput.val()==''){
        alert("No file entered!");
        return;
    }
    clearAnalysisResults();
    toggleChooseLogs();
    showSidebar();
    files=[];
    errorAnalysing=[];

    for(i=0;i<logInput[0].files.length;i++){
        if (logInput[0].files[i].type==='text/plain' && logInput[0].files[i].name.includes(".txt")){ //if text file
            readObject( logInput[0].files[i], i,"analyse","",false);
        }else if (supportedArchiveTypes.includes(logInput[0].files[i].type)){ //if zip file
            parseZipFile( i, logInput[0].files[i], logInput[0].files[i].webkitRelativePath);
        }else{ //wrong type
            errorAnalysing.push(logInput[0].files[i].name);
        }
    }

    setTimeout(() => {  
         if(errorAnalysing.length>0){
            var tableErrors=`
            <div class="alert alert-warning alert-dismissible fade show" role="alert">
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
                <h4 class="alert-heading">Error analysing files</h4>
                <a id='alert-expand-control' class='bold' data-toggle="collapse" href="#alert-expand-body" aria-expanded="false" aria-controls="alert-expand-body">Click here</a> to see list of files which couldn't be analysed.
                <div id="alert-expand-body" class="collapse">
                    <hr>
                    <ul id="alert-error-list" class="scroll-auto">
                    </ul>
                </div>
            </div>
                            `;
            $('body').append(tableErrors);
             for(let i=0;i<errorAnalysing.length;i++){
                $('#alert-error-list').append(`<li>${errorAnalysing[i]}</li>`);
             }
         }
        }, 1000);

}


/** Zipfiles are recursively read and sent to be analysed
 * 
 * @param {*} entryId - unique identifier
 * @param {*} zipFile - zipFile object
 * @param {*} path - path to current zipFile object
 */
function parseZipFile(entryId, zipFile, path=''){
    var new_zip = new JSZip(); //new instance
    new_zip.loadAsync(zipFile)
    .then(function(zip) {
        var files = zip.file(/.*/); //all files in array ZipObjects
        for (let i=0;i<files.length;i++){
            if( RegExp('\.txt').test(files[i].name)){ //text file
                readObject( files[i], entryId+'-'+i, "analyse", path, true);
            }else if(RegExp('\.zip').test(files[i].name)){
                files[i].async("blob")
                .then(function (file) {
                    if(path!==''){
                        path+='/';
                    }
                    parseZipFile(entryId+'-'+i, file, path+files[i].name);
                });
            }
        }
    });
}


/**
 * @param {*} file - file object
 * @param {String} entryId - id of file analysed
 * @param {*} type - describes what to do with read object
 * @param {*} path - path of current file
 * @param {boolean} isZipObject - describes wether file object is zip object
 */
function readObject(file, entryId, type="analyse", path='', isZipObject = false){
    if (isZipObject){
        files[entryId]={"file":file, "type": "zip"};
        file.async("string")
        .then(function success(text) {
            try {
                handleObject(JSON.parse(text), file, entryId, path, isZipObject, type);
            } catch (e){
                console.log(e);
                if(type=="analyse"){
                    errorAnalysing.push(path+file.name);
                }
                return;
            }
        });
    }else{  //is not zip object
        if(file.type==='text/plain'){
            files[entryId]={"file":file, "type": "text"};
            const reader = new FileReader();
            reader.readAsText(file);
            reader.addEventListener('load', (event) => {
                const text = event.target.result;
                try{
                    handleObject(JSON.parse(text), file, entryId, path, isZipObject, type);
                } catch (e){ 
                    console.log(e);
                    if(type=="analyse"){
                        errorAnalysing.push(path+file.name);
                    }
                    return;
                }
              });
        }else{
            alert("Enter text file!");
        }
    }
}


/**
 * 
 * @param {JSON} jsonLog - log content
 * @param {*} file - file object
 * @param {*} entryId - id of file analysed
 * @param {*} path - path of current file
 * @param {*} isZipObject - describes wether file object is zip object
 * @param {*} type - describes what to do with read object
 */
function handleObject(jsonLog, file, entryId, path, isZipObject, type){
    if (type==="analyse"){
        analyse( jsonLog, file, entryId, path, isZipObject);
    }else if(["replayer", "textGraph"].includes(type)){ //type==="replayer" 
        parseLogFile(jsonLog, type);
    }
}


/** analyses give jsonlog and add analysation content
 * 
 * @param {*} jsonLog - log content
 * @param {*} file - file object
 * @param {*} entryId - id of file analysed
 * @param {*} path - path of current file
 * @param {*} isZipObject - describes wether file object is zip object
 */
function analyse(jsonLog, file, entryId, path='', isZipObject = false){
    const startTime=new Date(jsonLog[0].time);
    const endTime=new Date(jsonLog[jsonLog.length-1].time);
    const elapsedDate=new Date(endTime-startTime);
    var elapsedTime=elapsedDate.toISOString().slice(11, -5).split(":");
    elapsedTime=elapsedTime[0].concat("h, ",elapsedTime[1],"min, ",elapsedTime[2],"sec");
    if(elapsedDate.getDate()>1){
        elapsedTime=(elapsedDate.getDate()-1).toString().concat(" days, ", elapsedTime)
    }

    var errorCount=0;
    var runCount=0;
    var copyPasteCount=0;
    var debugCount=0;
    var filesCreated=new Set();
    var filesRan=new Set();
    var filesOpened=new Set();
    var copiedTexts={};
    var errorTexts={};
    for(var i=0;i<jsonLog.length;i++){
        if(jsonLog[i].sequence==='ShellCommand' && jsonLog[i].command_text.slice(0,4)==='%Run'){
            runCount++;
            filesRan.add(jsonLog[i].command_text.slice(5).replaceAll('\'',''));
        }
        if(jsonLog[i].sequence==='TextInsert' && jsonLog[i].text.includes('Error') && jsonLog[i].text_widget_class==="ShellText"){
            errorCount++;
            var date=getDate1(jsonLog[i].time)
            errorTexts[date]=jsonLog[i].text;
        }
        if(jsonLog[i].sequence==='TextInsert' && jsonLog[i].text.includes('Debug')){
            debugCount++;
        }
        if(jsonLog[i].sequence==='<<Paste>>' && jsonLog[i].text_widget_class==="CodeViewText"){
            copyPasteCount++;
            var date=getDate1(jsonLog[i-1].time)
            copiedTexts[date]='<pre>'.concat(jsonLog[i-1].text,'</pre>');
        }
        if(jsonLog[i].sequence==='SaveAs'){
            var filename=jsonLog[i].filename.split('\\');
            filesCreated.add(filename[filename.length-1]);
        }
        if(jsonLog[i].sequence==='Open'){
            var filename=jsonLog[i].filename.split('\\');
            filesOpened.add(filename[filename.length-1]);
        }

    }
    
    var generalInfo={
        'Start time':startTime.toLocaleString('en-GB'),
        'End time':endTime.toLocaleString('en-GB'),
        'Elapsed time':elapsedTime,
        'Run count':runCount,
        'Error count':errorCount,
        'Paste text count':copyPasteCount,
        'Debug count':debugCount,
        'Files created':[...filesCreated].join('<br>'),
        'Files ran':[...filesRan].join('<br>'),
        'Files opened':[...filesOpened  ].join('<br>')
    }

    var idGeneralInfo=`tableGeneralInfo-${entryId}`;
    var idCopyPaste=`tableCopyPaste-${entryId}`;
    var idErrors=`tableErrors-${entryId}`;

    var tableGeneralInfo=`
                <div class="table-container" id="general-info-block">
                    <table class="table" id='${idGeneralInfo}'>
                        <thead class="thead-light">
                            <tr>
                            <th scope="colgroup" colspan="2">General Info</th>
                            </tr>
                        </thead>
                        <tbody>
                        </tbody>
                    </table>
                </div>`;
    var tableCopyPaste=`
            <div class="analysed-panel-btn-block" id='copiedTexts-${entryId}'>
                <a class="btn btn-primary" data-toggle="collapse" href="#collapseCopyPaste-${entryId}" role="button" aria-expanded="false" aria-controls="collapseCopyPaste-${entryId}">
                Pasted texts (${copyPasteCount})
                </a>
                <div class="collapse" id="collapseCopyPaste-${entryId}">
                    <div class="card card-body">
                        <table class="table" id='${idCopyPaste}'>
                        <tbody>
                            
                        </tbody>
                        </table>  
                    </div>
                </div>
            </div>`;
    var tableErrors=`
            <div class="analysed-panel-btn-block" id='errorTexts-${entryId}'>
                <a class="btn btn-primary" data-toggle="collapse" href="#collapseErrors-${entryId}" role="button" aria-expanded="false" aria-controls="collapseErrors-${entryId}">
                Errors (${errorCount})
                </a>
                <div class="collapse" id="collapseErrors-${entryId}">
                    <div class="card card-body">
                        <table class="table" id='${idErrors}'>
                        <tbody>
                            
                        </tbody>
                        </table>  
                    </div>
                </div>
            </div>`;
    var replayerButton=`
            <div class="analysed-panel-btn-block">
                <button id="btn-open-replayer-${entryId}" class="btn btn-primary btn-replayer" data-toggle="modal" data-target="#replayerModal" data-entry-id="${entryId}">
                    Open Replayer
                </button>
            </div>
            `;

    var textGraphButton=`
            <div class="analysed-panel-btn-block">
                <button id="btn-open-text-graph-${entryId}" class="btn btn-primary btn-graph" data-toggle="modal" data-target="#textGraphModal" data-entry-id="${entryId}">
                    Open program length graph
                </button>
            </div>
            `;

    var panelId=`list-${entryId}`;
    addLogAnalysisEntry( entryId, panelId, file, isZipObject, path);


    $('#'+panelId).append(tableGeneralInfo);
    $('#'+panelId).append(tableCopyPaste);
    $('#'+panelId).append(tableErrors);
    $('#'+panelId).append(replayerButton);
    $('#'+panelId).append(textGraphButton);

    displayDataTable(idGeneralInfo,generalInfo);
    displayDataTable(idCopyPaste,copiedTexts);
    displayDataTable(idErrors,errorTexts);

    $('#btn-open-replayer-'+entryId).click(readAnalysedFile);
    $('#btn-open-text-graph-'+entryId).click(readAnalysedFile);
}


/** adds log file row to analysed files and creates analysed card
 * 
 * @param {*} entryId - marks unique id for list groups defining attributes
 * @param {*} panelId - id of file analysed
 * @param {*} file  - file object
 * @param {*} isZipObject - describes wether file object is zip object
 * @param {*} path - path of current file
 */
function addLogAnalysisEntry( entryId, panelId, file, isZipObject = false, path=''){
    var tabList = $("#log-analysis-groups");
    var tabPanel = $("#log-analysis-results");
    var typeOfAnalysis=$("#input-analysis-type")[0].checked;

    setActive="";
    setActivePanel="";
    if (isZipObject){
        fileSize=`${Math.round(file._data.uncompressedSize/1024)}KB`;  
    }else{
        fileSize=`${Math.round(file.size/1024)}KB`;
    }
    if(path!==''){
        path+='/';
    }
    fileName=path+file.name;
    if (!isZipObject && file.webkitRelativePath!=""){
        fileName=file.webkitRelativePath
    }
    if(tabList[0].childElementCount===0){//first entry
        setActive="active";    
        setActivePanel="show active";
    }
    fileName=fileName.replaceAll('_','-');
    var newTabListElement = `<a class="list-group-item list-group-item-action failid ${setActive}" 
                            id="list-${entryId}-list" data-toggle="list" href="#list-${entryId}" role="tab" aria-controls="${entryId}">
                            <span class="badge badge-primary badge-pill">${fileSize}</span><br>${fileName}</a>`;

    var newTabPanelElement = `<div class="tab-pane fade ${setActivePanel}" id="${panelId}" role="tabpanel" aria-labelledby="list-${entryId}-list"></div>`;

    if (typeOfAnalysis){ //Multiple student analysis
        if(tabList[0].childElementCount===0){//first entry
            var accordion=`<div class="accordion" id="multiple-student-list"></div>`;
            tabList.append(accordion);
        }
        
        if(fileName.split('/').length>1 ){
            tabList=$('#multiple-student-list');
            
            var firstFolderIndex=0;
            if(!$("#input-log-type")[0].checked){
                firstFolderIndex=1;
            }
            firstFolder=fileName.split('/')[firstFolderIndex];  //accordion list element id
            var firstFolderName=firstFolder;

            firstFolderList=firstFolder.split(' ');
            if (firstFolderList.length>1){
                var firstFolderName=firstFolderList[0] + ' ' + firstFolderList[1].split('-')[0]; //list element name
            }

            var folderNameId=firstFolderName.replaceAll(/ |\./ig,'-');
            var multipleStudentId=`student-${firstFolder.replaceAll(/ |\./ig,'-')}`;

            if( $('#'+multipleStudentId).length===0){
                var show = '';
                var expanded = 'false';
                if( $('.list-group-item').length===0){ //first element expanded
                    show = 'show';
                    expanded = 'true';
                }
                var studentListElementName=`<a id="${folderNameId}" class="btn list-group-item list-group-item-action student-name" data-toggle="collapse" data-target="#${multipleStudentId}" aria-expanded="${expanded}" aria-controls="${multipleStudentId}" tabindex="0">
                                                    ${firstFolderName}
                                                </a>`;
                var studentListElementPanel=`<div id="${multipleStudentId}" class="collapse ${show}" aria-labelledby="${firstFolderName}" data-parent="#multiple-student-list">
                                            </div>`;
                tabList.append(studentListElementName);
                tabList.append(studentListElementPanel);
            }
            tabList=$('#'+multipleStudentId);
            $('#'+folderNameId).keyup(switchFolder);
        }
    }

    tabList.append(newTabListElement);
    tabPanel.append(newTabPanelElement);
    
    $(`#list-${entryId}-list`).keyup(switchListItem); //adds event that switches list items when tab pressed
    if (typeOfAnalysis){ //Multiple student analysis
        $(`#list-${entryId}-list`).click(switchListItem);
    }

    if(tabList[0].childElementCount===1){ //turn first file on
        $('.failid').first().focus();
    }
}


/** displays the data given to a table with id given
 * 
 * @param {string} tableId 
 * @param {json object} data 
 */
function displayDataTable( tableId, data){
    const tbody=$('#'+tableId+" tbody");
    tbody.empty();
    for(const key in data){
        if(Array.isArray(data[key])){
            continue;
        }
        tbody.append('<tr><td>'.concat(key,'</td><td>',data[key],'</td></tr>'));
    }
}

/** return date which is converted to en-GB LocaleString
 * 
 * @param {Date} date 
 */
function getDate1(date){
    return new Date(date).toLocaleString('en-GB');
}


/**  already analysed file is passed to be read and the type is chosen 
 *  based on what button was clicked
 */
function readAnalysedFile(){

    var entryId=$(this)[0].attributes['data-entry-id'].value

    if (files[entryId]==null){
        alert('File not found in input space.')
    }
    var isZipObject=files[entryId].type=="zip";
    if($(this)[0].attributes['data-target'].value=='#replayerModal'){
        readObject(files[entryId].file, '', type="replayer", '', isZipObject);
    }else if($(this)[0].attributes['data-target'].value=='#textGraphModal'){
        readObject(files[entryId].file, '', type="textGraph", '', isZipObject);
    }
}


/** Parses jsonLog and caches parced log content to jsonLog. 
 * 
 * @param {*} jsonLog - log content
 * @param {*} type - describes what to do with read object
 */
function parseLogFile(jsonLog, type){
    const eventListGroup=$('#modal-sidebar-event-list');
    if(type=="replayer"){
        eventListGroup.empty();
    }

    var eventList;
    var split='';

    var replayerFiles=[];
    var shellText=[];

    var data=[]

    const reducerStringArray = (accumulator, currentValue) => accumulator + currentValue.length;
    const reducerFiles= (accumulator, currentValue) => accumulator + currentValue.codeViewText.reduce(reducerStringArray,0);

    for(var i=0;i<jsonLog.length;i++){

        [replayerFiles, shellText]=addLogEvent(replayerFiles, shellText, jsonLog[i]);

        if(type=="replayer"){
            if(i%logCacheInterval==0){
                jsonLog[i]["analysation_cache"]={"replayerFiles":JSON.parse(JSON.stringify(replayerFiles)),"shellText":JSON.parse(JSON.stringify(shellText))}; 
            }

            if(i>1){
                split=(new Date(jsonLog[i].time))-(new Date(jsonLog[i-1].time));
                split=Math.floor(split / 1e3)
                if(split<1){
                    split='';
                }
            }
            
            eventList=`
                        <div id="${'event-list-row-'+i}" class="row event-row event-list-row" data-logfile-object-index="${i}" tabindex="0">
                            <div class="col-7 event-list-name">${encodeEntitie(jsonLog[i].sequence)}</div>
                            <div class="col-4 event-list-sec">${split}</div>
                        </div>
                        `;

            eventListGroup.append(eventList);
        }else if(type=="textGraph"){
            if (jsonLog[i].sequence=='TextInsert' || jsonLog[i].sequence=='TextDelete'){
                data.push({"x": jsonLog[i].time,"y":replayerFiles.reduce(reducerFiles,0)}); //.split('T').join(' ')  jsonLog[i].time
            }
        }
    }
    if(type=="replayer"){
        $('.event-list-row').focus(handleEventListFocus);
        modalJsonLog=jsonLog;
    }else if(type=="textGraph"){
    chart = new Chart( 'text-length-graph', {
        // The type of chart we want to create  
        type: 'line',
        // The data for our dataset
        data: {
            datasets: [{
              label: 'Character count',
              data:data,
              borderColor: 'rgba(0, 98, 168, 1)',
              backgroundColor: 'rgba(0, 98, 168, 0.1)',
              fill: true,
              pointRadius:0
            }]
          }
        ,
        // Configuration options go here
        options: {
            maintainAspectRatio:false,
            interaction: {
                intersect:false,
                axis: 'x'
              },
            plugins:{
                title: {
                    display: true,
                    text: 'Text length graph',
                    font: {
                        size: 20
                    }
                },
                legend:{
                    display:false
                }
            },
            scales: {
                 y: {
                    min:0,
                    title: {
                        display: true,
                        text: 'Character count',
                        font: {
                            size: 14,
                            style:'bold'
                        }
                    }
                }, 
                x: {
                    type: 'timeseries',
                    display: true,
                    title: {
                        display: true,
                        text: 'Time',
                        font: {
                            size: 14,
                            style:'bold'
                        }
                    },
                    time: {
                        unit: 'second',
                        displayFormats: {
                            second: 'dd/MM HH:mm'
                        },
                        tooltipFormat: 'dd/MM/yyyy HH:mm:ss'
                    } ,    
                    ticks: {
                        source:'data',
                        maxTicksLimit:10,
                    } 
                }
            }
        }
    }); 
    }
}


/** Edits replayerFiles, shellText based on logevent.
 * 
 * @param {Array} replayerFiles - contains array objects of opened files and their contents
 * @param {String array} shellText - content of shell
 * @param {*} logEvent - current jsonlog event object
 * @returns edited replayerFiles, shellText
 */
function addLogEvent(replayerFiles, shellText, logEvent){
    var activeIndex=getActiveIndex(replayerFiles);
    if (logEvent.sequence=='Open' || logEvent.sequence=='NewFile'){

        if(activeIndex!=-1){
            replayerFiles[activeIndex].active=false;
        }

        var filename="";
        if(logEvent.sequence=='NewFile'){
            filename="<untitled>";
        }else if(logEvent.sequence=='Open'){
            var filenameList=logEvent.filename.split('\\');
            filename=filenameList[filenameList.length-1];
        }
        replayerFiles.push({"active":true, "text_widget_id":logEvent.text_widget_id, "filename":filename, "codeViewText":[]});

    }else if (logEvent.sequence=='SaveAs'){
        var filenameList=logEvent.filename.split('\\');
        var filename=filenameList[filenameList.length-1];

        if(activeIndex!=-1){
            replayerFiles[activeIndex].filename=filename;
        }else{
            console.log("Error replayer no active files.\n"+replayerFiles);
        }
    }else if (logEvent.sequence=='TextInsert' || logEvent.sequence=='TextDelete'){
        if(logEvent.text_widget_class=='CodeViewText'){
            if(activeIndex!=-1){
                replayerFiles[activeIndex].codeViewText=addChangesToText(replayerFiles[activeIndex].codeViewText,logEvent);
            }else{
                console.log("Error replayer no active files.\n"+replayerFiles);
            }
        }else if(logEvent.text_widget_class=='ShellText'){
            var shellText=addChangesToText(shellText,logEvent);
        }
    }else if(logEvent.sequence=='<Button-1>' && logEvent.text_widget_class=='CodeViewText'){ //switch files
        if(activeIndex!=-1){
            replayerFiles[activeIndex].active=false;
        }
        for(var i=0; i<replayerFiles.length;i++){
            if(replayerFiles[i].text_widget_id==logEvent.text_widget_id){
                replayerFiles[i].active=true;
                break;    
            }
        }

    }
    return [replayerFiles, shellText];
}


/**
 * 
 * @param {*} objectList list of objects containing an active property.
 * @returns objectlist index of object with active property set to true.
 */
function getActiveIndex( objectList){
    for(var i=0; i<objectList.length;i++){
        if(objectList[i].active){
            return i;
        }
    }
    return -1;
}


/**
 * 
 * @param {String array} ideText - text added or removed based on logEvent
 * @param {*} logEvent - current jsonlog event object
 * @returns edited ideText
 */
function addChangesToText(ideText, logEvent){

    if(logEvent.sequence=='TextInsert'){
        var textEntered=logEvent.text.split("\n");
        var index=logEvent.index.split(".");
        var indexRow=index[0]-1;
        var indexColumn=index[1];

        if (indexRow>=ideText.length){ //text added to end
            ideText=ideText.concat(textEntered);
        }else if(textEntered.length==1){
            var row=ideText[indexRow];
            ideText[indexRow]=row.slice(0,indexColumn)+textEntered[0]+row.slice(indexColumn,row.length);
        }else{
            var firstRow=ideText[indexRow];
            textEntered[textEntered.length-1]=textEntered[textEntered.length-1]+firstRow.slice(indexColumn,firstRow.length);
            ideText[indexRow]=firstRow.slice(0,indexColumn)+textEntered[0];
            ideText.splice(indexRow+1,0, ...textEntered.slice(1,textEntered.length));

        }
    }else if(logEvent.sequence=='TextDelete'){
        var index1=logEvent.index1.split(".");
        var index1Row=parseInt(index1[0]-1);
        var index1Column=parseInt(index1[1]);

        var index2=logEvent.index2;
        var row=ideText[index1Row];
        
        if(row!=null){
            if(index2=="None"){
                if(index1Column<row.length){
                    ideText[index1Row]=row.slice(0,index1Column)+row.slice(index1Column+1,row.length);
                }else{
                    ideText[index1Row]=row+ideText[index1Row+1];
                    ideText.splice(index1Row+1,1);
                }
            }else{
                index2=index2.split(".");
                var index2Row=parseInt(index2[0]-1);
                var index2Column=parseInt(index2[1]);

                if(index1Row==index2Row){
                    ideText[index1Row]=row.slice(0,index1Column)+row.slice(index2Column,row.length);
                }else{
                    var lastRow=ideText[index2Row];

                    if(lastRow!=null){
                        ideText[index1Row]=row.slice(0,index1Column)+lastRow.slice(index2Column,lastRow.length);
                        ideText.splice(index1Row+1,index2Row-index1Row);
                    }
                }
            }
        }
    }
    return ideText;
}


/**
 * 
 * @param {String} stringToEncode 
 * @returns stringToEncode which is made html safe 
 */
function encodeEntitie( stringToEncode){
    return stringToEncode.replaceAll('<','&lt;').replaceAll('>','&gt;');
}


/** When event list row clicked in replayer, the event state is displayed in replayer
 * 
 */
function handleEventListFocus(){
    var jsonLogIndex=$(this)[0].attributes['data-logfile-object-index'].value;
    var eventListId=$(this)[0].attributes['id'].value;
    $(".event-list-row.active").removeClass('active');
    $("#"+eventListId).addClass('active');

    const eventListDataGroup=$('#modal-sidebar-event-data-list');

    eventListDataGroup.empty();

    var eventListData;
    var attrIndex=0;

    var currentObject=modalJsonLog[jsonLogIndex];

    var attrVal;

    for(const attribute in currentObject){
        if(attribute=='analysation_cache'){continue;}
        attrVal=currentObject[attribute];
        if(['sequence','text'].includes(attribute)){
            attrVal=encodeEntitie(attrVal);
        }
        eventListData=`
                    <div class="row event-row">
                        <div class="col-6">${attribute}</div>
                        <div class="col-6 json-value">${attrVal}</div>
                    </div>    
                    `;

        eventListDataGroup.append(eventListData);
        attrIndex++;
    }


    var nearestCacheIndex=jsonLogIndex-(jsonLogIndex%logCacheInterval);

    var replayerFiles=JSON.parse(JSON.stringify(modalJsonLog[nearestCacheIndex].analysation_cache.replayerFiles));
    var shellText=JSON.parse(JSON.stringify(modalJsonLog[nearestCacheIndex].analysation_cache.shellText));

    var activeIndex=getActiveIndex(replayerFiles);
    
    for(var i=nearestCacheIndex+1;i<=jsonLogIndex;i++){
        [replayerFiles, shellText]=addLogEvent(replayerFiles, shellText, modalJsonLog[i]);
    }
    
    var activeIndex=getActiveIndex(replayerFiles);
    if(replayerFiles[activeIndex]!=null){
        var programText=replayerFiles[activeIndex].codeViewText.join("\n");
        $("#modal-program-text").text(programText);
    }

    if(shellText!=null){
        $("#modal-shell-text").text(shellText.join("\n"));
    }

    $("#modal-main-header").empty()
    for(var i=0;i<replayerFiles.length;i++){
        var file=`<div class="p-2 file ${replayerFiles[i].active ? 'active' : ''}">${encodeEntitie(replayerFiles[i].filename)}</div>`;
        $("#modal-main-header").append(file);
    }

    $('#modal-main-shell').scrollTop( $('#modal-main-shell')[0].scrollHeight); //scroll to bottom of shell

    hljs.highlightAll(); //colour the code in replayer
}