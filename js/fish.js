var fileContent;
var fileNames;
var listOfTrials;
var csvFileName;
var url;
var exportInfo;
var zones = [];
var boundaryLogging=false;
var progressLogging=false;
var numErrors=0;

function getZones() {
	zones = [];
	var z = $('#zoneDiv tr').length - 1;
	for ( q = 0; q < z; q++) {
		zones.push($('#' + q + 'max').val() - $('#' + q + 'min').val());
	}
}

function updateTank() {
	$('#tankDiv').html('');
	var tH = $('#tankHeight').val();
	var tW = $('#tankWidth').val();
	var hD = $('#heightDiv').val();
	var wD = $('#widthDiv').val();

	$('#tankDiv').attr('width', tW);
	var row = '';
	var cell = 1;
	for ( i = 0; i < hD; i++) {
		row = '<tr>';
		for (var j = 0; j < wD; j++) {
			row += '<td height=' + (tH / hD) + ' id=cell' + cell + '>Cell-' + cell + '</td>';
			cell++;
		}
		row += '</tr>';
		$('#tankDiv').append(row);
	}

	getZones();
}

function updateExteriorVal() {
	var percentage = $('#exterior').val() / 100.0;
	$('#extamt').val($('#tankHeight').val() * percentage);
}

function toSec(milli) {
	return (milli / 1000.0).toFixed(2);
}

//on load
$(function() {
	//load any saved values
	for(var t=0;t<9;t++){
		if (localStorage.getItem('jobstart'+(t+1)) !== null)
			$('#jobstart'+(t+1)).val(localStorage.getItem('jobstart'+(t+1)));
	}
	if (localStorage.getItem("width") !== null)
		$('#tankWidth').val(localStorage.getItem('width'));
	if (localStorage.getItem("height") !== null)
		$('#tankHeight').val(localStorage.getItem('height'));
	if (localStorage.getItem("widthDiv") !== null)
		$('#widthDiv').val(localStorage.getItem('widthDiv'));
	if (localStorage.getItem("heightDiv") !== null)
		$('#heightDiv').val(localStorage.getItem('heightDiv'));
	if (localStorage.getItem("xbound") !== null)
		$('#xbound').val(localStorage.getItem('xbound'));
	if (localStorage.getItem("ybound") !== null)
		$('#ybound').val(localStorage.getItem('ybound'));
	if (localStorage.getItem("movingRange") !== null)
		$('#moving').val(localStorage.getItem('movingRange'));
	if (localStorage.getItem("movingTime") !== null)
		$('#still').val(localStorage.getItem('movingTime'));
	if (localStorage.getItem("edgeAmount") !== null)
		$('#exterior').val(localStorage.getItem('edgeAmount'));
	if (localStorage.getItem("poix") !== null)
		$('#xpoint').val(localStorage.getItem('poix'));
	if (localStorage.getItem("poiy") !== null)
		$('#ypoint').val(localStorage.getItem('poiy'));
	if (localStorage.getItem("poiRadius") !== null)
		$('#rpoint').val(localStorage.getItem('poiRadius'));

	//initial table creation
	updateTank();

	//set exterior
	updateExteriorVal();

	//change tank dimensions
	$('#tankWidth,#tankHeight,#widthDiv,#heightDiv').change(function() {
		updateTank();
	});

	$('#tankHeight,#exterior').change(function() {
		updateExteriorVal();
	});

	$('#saveDefaults').on('click',function(){
		//save starting coord
		$('input[id^="jobstart"]').each(function(index){
			localStorage.setItem($(this).attr('id'),$(this).val());
		});
		//save height/width
		localStorage.setItem('width',$('#tankWidth').val());
		localStorage.setItem('height',$('#tankHeight').val());
		//save divisions
		localStorage.setItem('widthDiv',$('#widthDiv').val());
		localStorage.setItem('heightDiv',$('#heightDiv').val());
		//save boundaries
		localStorage.setItem('xbound',$('#xbound').val());
		localStorage.setItem('ybound',$('#ybound').val());
		//save moving/still
		localStorage.setItem('movingRange',$('#moving').val());
		localStorage.setItem('movingTime',$('#still').val());
		//save edge
		localStorage.setItem('edgeAmount',$('#exterior').val());
		//save POI
		localStorage.setItem('poix',$('#xpoint').val());
		localStorage.setItem('poiy',$('#ypoint').val());
		localStorage.setItem('poiRadius',$('#rpoint').val());
	});
	//if user changes # of zones or width of zones can recalculate time in each, without re-upload
	$('#calculate').on('click', function() {
		if (fileContent != undefined && fileContent.length > 0) {
			listOfTrials = [];
			//remove?
			//$('#chartType').val('');
			calculate(false);
		}
	});

	//clear other file input, so user knows what they are viewing
	$('input[type=file]').on('change', function() {
		var butId = $(this).attr('id');
		var controlFile = $('#fileSelect');
		var controlFolder = $('#folderSelect');
		if (butId == 'fileSelect') {
			controlFolder.replaceWith( controlFolder = controlFolder.clone(true));
		} else {
			controlFile.replaceWith( controlFile = controlFile.clone(true));
		}

		//enable button
		$('#calculate').attr('disabled', false);
		$('#calculate').attr('title', 'Track that fish!');

	});
});

function calcDist(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

var PADDING_AMT = 12;
function pad(str,padding=PADDING_AMT,comma) {
	if (comma == undefined)
	comma = true;
	str += '';
	//make sure input is string
	var pad = Array(padding + 1).join(" ");
	var ans = ( comma ? ',' : '') + pad.substring(0, pad.length - str.length) + str;
	return ans;
}

//calculate time each job spends per zone
function calculate(checkForNegatives) {
	numErrors=0;
  progressLogging=$('#progressLogging').is(':checked');
	boundaryLogging=$('#boundaryLogging').is(':checked');
	var hD = parseInt($('#heightDiv').val());
	var wD = parseInt($('#widthDiv').val());
	//get starting points
	var num_jobs=0;
	var startingPos=[];
	$('input[id^="jobstart"]').each(function(index){
		if($(this).val()!=''&&$(this).val().indexOf(',')!=-1){
			num_jobs++;
			startingPos.push([parseInt($(this).val().split(',')[0]),parseInt($(this).val().split(',')[1])]);
		}
	});
	//csv header
	exportInfo = pad('ID', PADDING_AMT, false) + pad('moving') + pad('still') + pad('moving_prop') + pad('still_prop') + pad('x_lat') + pad('x_bound_num') + pad('y_lat') + pad('y_bound_num') + pad('interior') + pad('exterior') + pad('int_prop') + pad('ext_prop') + pad('poi_lat') + pad('poi_time') + pad('poi_entered') + pad('bound_crossed') + pad('explored');
	for ( c = 0; c < hD * wD; c++) {
		exportInfo += pad('cell_' + (c + 1));
	}
	for ( c = 0; c < hD * wD; c++) {
		exportInfo += pad('cell_prop' + (c + 1));
	}
	exportInfo += '\n';

	var start={};
	for(var j=0;j<num_jobs;j++){
		start[j]={}
		start[j].x=0;
		start[j].y=0;
		start[j].timestart=-1;
		start[j].timestop=-1;
		start[j].diff=0;
		start[j].total=0;
		start[j].huntx=false;
		start[j].hunty=false;
		start[j].realx=0;
		start[j].realy=0;
		start[j].prealx=0;
		start[j].prealy=0;
		start[j].name='';
	}
	var job;

	//for each file
	for ( i = 0; i < fileContent.length; i++) {
		job = fileContent[i];
		console.log('working on:' + fileNames[i]);
		//var split = fileNames[i].indexOf('-');
		//listOfTrials.concat(fileNames[i].split('-'));
		listOfTrials=fileNames[i].split('-');
		//ERROR-input says there are x jobs and there are y-jobs in the file
		if(listOfTrials.length!=num_jobs){
			alert('There are '+num_jobs+' jobs in the input but the file ('+fileNames[i]+') has '+listOfTrials.length+' jobs');
			return;
		}
		for(var j=0;j<num_jobs;j++){
			//x
			if (job[0][j*3+1] == -1){
				start[j].huntx = true;
			}
			//y
			if (job[0][j*3+2] == -1){
				start[j].hunty = true;
			}
			//console.log(j+' hunting y '+start[j].hunty.toString());

			//get rid of negative numbers
			if (checkForNegatives) {
				for ( t = 0; t < job.length; t++) {
					start[j].realx = job[t][j*3+1];
					start[j].realy = job[t][j*3+2];
					//console.log('y is:'+start[j].realy);
					//console.log(start[j].hunty && start[j].realy != -1);
					if (start[j].huntx && start[j].realx != -1) {
						for ( x = t; x >= 0; x--) {
							job[x][j*3+1] = start[j].realx;
						}
						start[j].huntx = false;
					} else if (!start[j].huntx && start[j].realx == -1) {
						job[t][j*3+1] = start[j].prealx;
						start[j].realx = start[j].prealx;
					}
					if (start[j].hunty && start[j].realy != -1) {
						for ( x = t; x >= 0; x--) {
							job[x][j*3+2] = start[j].realy;
						}
						start[j].hunty = false;
					} else if (!start[j].hunty && start[j].realy == -1) {
						job[t][j*3+2] = start[j].prealy;
						start[j].realy = start[j].prealy;
					}
					start[j].prealx = start[j].realx;
					start[j].prealy = start[j].realy;
				}
			}
			if(progressLogging){
				console.log('negatives removed from job '+(i+1)+' of '+fileContent.length+'- '+(((i+1)*100)/fileContent.length).toFixed(0)+'%');
			}
		}

		//data in array
		//console.log(JSON.stringify(listOfTrials));

		//input info
		var tH = parseInt($('#tankHeight').val());
		var tW = parseInt($('#tankWidth').val());
		var cellWidth = tW / wD;
		var cellHeight = tH / hD;
		var xb = parseInt($('#xbound').val());
		var yb = parseInt($('#ybound').val());
		var moveAllowed = parseInt($('#moving').val());
		var moveTime = parseInt($('#still').val());
		var extRange = parseInt($('#tankHeight').val()) * parseInt($('#exterior').val()) / 100.0;
		var poix = parseInt($('#xpoint').val());
		var poiy = parseInt($('#ypoint').val());
		var radius = parseInt($('#rpoint').val());
		var startTime = job[0][0];
		var prevTime = job[0][0];
		var moveRatio = moveAllowed / moveTime;
		var cellNumbers=[];
		var trow=[];
		var row,col;
		for(var q=0;q<hD;q++){
			for(var r=0;r<wD;r++){
				trow.push((q*wD)+r+1);
			}
			cellNumbers.push(trow.slice(0));
			trow=[];
		}
		if(xb>tW){
			alert('X boundary ('+xb+') is greater than the tank width ('+tW+')');
			return;
		}
		if(yb>tH){
			alert('Y boundary ('+yb+') is greater than the tank height ('+tH+')');
			return;
		}

		var fileData={};
		for(var j=0;j<num_jobs;j++){
			fileData[j]={};
			//general vars
			fileData[j].x=0;
			fileData[j].y=0;
			fileData[j].name=listOfTrials[j];
			fileData[j].cells=new Array(hD * wD).fill(0);
			fileData[j].cellb=[];
			fileData[j].left=job[0][j*3+1]<xb;
			fileData[j].down=job[0][j*3+2]<yb;
			fileData[j].xlat=0;
			fileData[j].ylat=0;
			fileData[j].xcross=0;
			fileData[j].ycross=0;
			fileData[j].prevx=job[0][j*3+1];
			fileData[j].prevy=job[0][j*3+2];
			fileData[j].moving=0;
			fileData[j].still=0;
			fileData[j].interior=0;
			fileData[j].exterior=0;
			fileData[j].withinpoi=calcDist(fileData[j].prevx, fileData[j].prevy, poix, poiy) <= radius;
			fileData[j].withinstart=fileData[j].withinpoi ? 0 : -1;
			fileData[j].within=0;
			fileData[j].poilat=fileData[j].withinpoi ? 0 : -1;
			fileData[j].poi=fileData[j].withinpoi ? 1 : 0;
			fileData[j].tempd=0;
			fileData[j].cellnum=0;
			fileData[j].prev=-1;
		}

		var diff;
		//console.log(job);
		for ( l = 0; l < job.length; l++) {
			for(var j=0;j<num_jobs;j++){
				fileData[j].x=job[l][j*3+1]-startingPos[j][0];
				fileData[j].y=job[l][j*3+2]-startingPos[j][1];
				//cell calc
				row=Math.floor(fileData[j].y/cellHeight);
				col=Math.floor(fileData[j].x/cellWidth);
				if(row<0||col<0||row>=cellNumbers.length||col>=cellNumbers[row].length){
					numErrors++;
					if(numErrors>5){
						console.log('Too many errors, stopped calculating');
						return;
					}
					console.log('error on line:'+JSON.stringify(job[l]));
					console.log('Error reading: \''+fileData[j].name+'\' when time: '+job[l][0]+', row, col was calculated to be '+(row+1)+','+(col+1));
					fileData[j].cellnum=-1;
				}else{
					fileData[j].cellnum=cellNumbers[row][col];
					if(fileData[j].prev!=fileData[j].cellnum){
						fileData[j].cellb.push([fileData[j].prev, fileData[j].cellnum])
					}
				}
				if(l==0){
					fileData[j].cells[fileData[j].cellnum-1]+=parseInt(job[l][0]);
				}
				else{
					fileData[j].cells[fileData[j].cellnum-1]+=parseInt(job[l][0])-parseInt(job[l-1][0]);
				}
				fileData[j].prev = fileData[j].cellnum;
				//moving/still
				if (((job[l][0] - prevTime) / 1000) != 0 && calcDist(fileData[j].x, fileData[j].y, fileData[j].prevx, fileData[j].prevy) / ((job[l][0] - prevTime) / 1000) >= moveRatio) {
					fileData[j].moving += job[l][0] - prevTime;
				} else {
					fileData[j].still += job[l][0] - prevTime;
				}
				fileData[j].prevx = fileData[j].x;
				fileData[j].prevy = fileData[j].y;
				//near exterior
				if (fileData[j].x < extRange || fileData[j].x > tW - extRange || fileData[j].y < extRange || fileData[j].y > tH - extRange) {
					fileData[j].exterior += job[l][0] - prevTime;
				} else {
					fileData[j].interior += job[l][0] - prevTime;
				}
				//near POI
				fileData[j].tempd = calcDist(fileData[j].x, fileData[j].y, poix, poiy);
				//fish1
				if (fileData[j].withinpoi) {
					if (fileData[j].tempd > radius) {
						fileData[j].within += job[l][0] - fileData[j].withinstart;
						fileData[j].withinpoi = false;
					}
				} else {
					if (fileData[j].tempd <= radius) {
						fileData[j].withinpoi = true;
						fileData[j].poi++;
						if (fileData[j].poilat == -1) {
							fileData[j].poilat = job[l][0] - 0;
						}
						fileData[j].withinstart = job[l][0];
					}
				}
				//boundary crossing calc
				//fish x boundary
				if (fileData[j].left && !(fileData[j].x < xb)) {//crossed left to right
					if (fileData[j].xlat == 0) {
						fileData[j].xlat = job[l][0] - startTime;
					}
					fileData[j].left=false;
					fileData[j].xcross++;
				} else if (!fileData[j].left && fileData[j].x < xb) {//crossed right to left
					if (fileData[j].xlat == 0) {
						fileData[j].xlat = job[l][0] - startTime;
					}
					fileData[j].left=true;
					fileData[j].xcross++;
				}
				//fish y boundary
				if (fileData[j].down && !(fileData[j].y < yb)) {//crossed down to up
					if (fileData[j].ylat == 0) {
						fileData[j].ylat = job[l][0] - startTime;
					}
					fileData[j].down=false;
					fileData[j].ycross++;
				} else if (!fileData[j].down && fileData[j].y < yb) {//crossed up to down
					if (fileData[j].ylat == 0) {
						fileData[j].ylat = job[l][0] - startTime;
					}
					fileData[j].down=true;
					fileData[j].ycross++;
				}
			}

			prevTime = job[l][0];
		}

		//data to csv format
		var total_time = fileData[0].moving + fileData[0].still;
		for(var j=0;j<num_jobs;j++){
			if(boundaryLogging){
				console.log(fileData[j].name+':'+JSON.stringify(fileData[j].cellb))
			}
			fileData[j].movingProp=(fileData[j].moving / total_time).toFixed(2);
			fileData[j].stillProp=(fileData[j].still / total_time).toFixed(2);
			fileData[j].intProp=(fileData[j].interior / total_time).toFixed(2);
			fileData[j].extProp=(fileData[j].exterior / total_time).toFixed(2);
			exportInfo += pad(fileData[j].name, PADDING_AMT, comma = false) + pad(toSec(fileData[j].moving)) + pad(toSec(fileData[j].still)) + pad(fileData[j].movingProp) + pad(fileData[j].stillProp) + pad(toSec(fileData[j].xlat)) + pad(fileData[j].xcross) + pad(toSec(fileData[j].ylat)) + pad(fileData[j].ycross);
			exportInfo += pad(toSec(fileData[j].interior)) + pad(toSec(fileData[j].exterior)) + pad(fileData[j].intProp) + pad(fileData[j].extProp) + pad(toSec(fileData[j].poilat)) + pad(toSec(fileData[j].within)) + pad(fileData[j].poi) + pad(fileData[j].cellb.length) + pad((fileData[j].cellb.length / toSec(total_time)).toFixed(2));
			for ( c = 0; c < hD * wD; c++) {
				exportInfo += pad(toSec(fileData[j].cells[c]));
			}
			for ( c = 0; c < hD * wD; c++) {
				exportInfo += pad((fileData[j].cells[c] / total_time).toFixed(2));
			}
			exportInfo += '\n';
		}


	}
	var d = new Date();
	csvFileName = d.toLocaleDateString().replace(/\//g, '_') + '_';
	if (fileContent.length == 1){
		csvFileName += "1file.csv";
	}
	else{
		csvFileName = csvFileName + fileContent.length + 'files.csv';
	}
	//console.log(csvFileName);
	//console.log(exportInfo);
	exportInfo = exportInfo.replace(/\n/g, "\r\n");
	var downloadContent = new Blob([exportInfo], {
		type : 'text/csv'
	});
	url = window.URL.createObjectURL(downloadContent);
	$('#download').attr('href', url);
	$('#download').attr('download', csvFileName);

	//download change icon, title, name
	$('#downloadImg').attr('src', 'img/download.png');
	$('#download').attr('title', 'Download fish tracking data');
	$('#download').attr('name', 'download');
}

function readmultifiles(files) {
	numErrors=0;
	progressLogging=$('#progressLogging').is(':checked');
	fileContent = [];
	fileNames = [];
	globalFiles = files;
	var reader = new FileReader();
	var temp,
	ntemp;
	function readFile(index) {
		ntemp = [];
		if (index >= files.length){
			return;
		}

		var file = files[index];
		fileNames.push(file.name);
		reader.onload = function(e) {
			// get file content
			var bin = e.target.result;
			//break file content by line breaks
			temp = bin.match(/[^\r\n]+/g);
			for ( i = 0; i < temp.length; i++) {
				//break each line by spaces
				t = temp[i].split(/\s+/);
				//if not 7 values check **TODO: add checks for various number columns
				if (t.length != 7) {
					var diff = 7 - t.length;
					if (diff % 3 == 0) {
						ntemp.push(t);
					} else {
						numErrors++;
						if(numErrors>5){
							break;
						}
						console.log('Error reading:' + file.name + ' at line ' + i);
					}
				} else {
					ntemp.push(t);
				}
			}
			fileContent.push(ntemp);
			if(progressLogging){
				console.log('read file '+(index+1)+' of '+files.length+'- '+(((index+1)*100)/files.length).toFixed(0)+'%');
			}
			readFile(index + 1);
			if (fileContent.length == files.length) {
				listOfTrials = [];
				calculate(true);
			}
		}
		reader.readAsText(file);
	}

	readFile(0);
}
