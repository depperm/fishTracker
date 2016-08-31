var fileContent;
var fileNames;
var listOfTrials;
var csvFileName;
var url;
var exportInfo;
var zones = [];

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
		//download change icon, title, name
		$('#downloadImg').attr('src', 'img/download.png');
		$('#download').attr('title', 'Download fish tracking data');
		$('#download').attr('name', 'download');

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
	var hD = $('#heightDiv').val();
	var wD = $('#widthDiv').val();
	var job,
	    job1x,
	    job1y,
	    job2x,
	    job2y;
	var time1start = -1,
	    time1stop = -1,
	    time2start = -1,
	    time2stop = -1;
	var diff1,
	    diff2,
	    total1,
	    total2;
	var hunt1 = false,
	    hunt2 = false,
	    hunt3 = false,
	    hunt4= false;
	var real1,
	    real2,
	    real3,
	    real4,
	    preal1,
	    preal2,
	    preal3,
	    preal4;
	var name1,
	    name2;
	//csv header
	exportInfo = pad('ID', PADDING_AMT, false) + pad('moving') + pad('still') + pad('moving_prop') + pad('still_prop') + pad('x_lat') + pad('x_bound_num') + pad('y_lat') + pad('y_bound_num') + pad('interior') + pad('exterior') + pad('int_prop') + pad('ext_prop') + pad('poi_lat') + pad('poi_time') + pad('poi_entered') + pad('bound_crossed') + pad('explored');
	for ( c = 0; c < hD * wD; c++) {
		exportInfo += pad('cell_' + (c + 1));
	}
	for ( c = 0; c < hD * wD; c++) {
		exportInfo += pad('cell_prop' + (c + 1));
	}
	exportInfo += '\n';
	//for each file
	for ( i = 0; i < fileContent.length; i++) {
		job = fileContent[i];
		console.log('working on:' + fileNames[i]);
		var split = fileNames[i].indexOf('-');
		if (split > 0) {
			name1 = fileNames[i].substring(0, split);
			name2 = fileNames[i].substring(split + 1);
			listOfTrials.push(name1);
			listOfTrials.push(name2);
		} else {
			name1 = fileNames[i];
			name2 = '';
			listOfTrials.push(name1);
		}
		//x1
		if (job[0][1] == -1)
			hunt1 = true;
		//x2
		if (job[0][4] == -1)
			hunt2 = true;
		//y1
		if (job[0][2] == -1)
			hunt3 = true;
		//y2
		if (job[0][5] == -1)
			hunt4 = true;
		//get rid of negative numbers
		if (checkForNegatives) {
			for ( t = 0; t < job.length; t++) {
				real1 = job[t][1];
				real2 = job[t][4];
				real3 = job[t][2];
				real4 = job[t][5];
				if (hunt1 && real1 != -1) {
					for ( x = i; x >= 0; x--) {
						job[x][1] = real1;
					}
					hunt1 = false;
				} else if (!hunt1 && real1 == -1) {
					job[t][1] = preal1;
					real1 = preal1;
				}
				if (hunt2 && real2 != -1) {
					for ( x = i; x >= 0; x--) {
						job[x][4] = real2;
					}
					hunt2 = false;
				} else if (!hunt2 && real2 == -1) {
					job[t][4] = preal2;
					real2 = preal2;
				}
				if (hunt3 && real3 != -1) {
					for ( x = i; x >= 0; x--) {
						job[x][2] = real3;
					}
					hunt3 = false;
				} else if (!hunt3 && real3 == -1) {
					job[t][2] = preal3;
					real3 = preal3;
				}
				if (hunt4 && real4 != -1) {
					for ( x = i; x >= 0; x--) {
						job[x][5] = real4;
					}
					hunt4 = false;
				} else if (!hunt4 && real4 == -1) {
					job[t][5] = preal4;
					real4 = preal4;
				}
				preal1 = real1;
				preal2 = real2;
				preal3 = real3;
				preal4 = real4;
			}
		}

		//data in array
		//console.log(job);

		//general vars
		var x1,y1,x2,y2;
		//vars for cell calc
		var tH = $('#tankHeight').val();
		var tW = $('#tankWidth').val();
		var cellWidth = tW / wD;
		var cellHeight = tH / hD;
		var cells1 = new Array(hD * wD).fill(0);
		var cells2 = new Array(hD * wD).fill(0);
		var cell1b = [];
		var cell2b = [];

		//vars for boundary
		var startTime = job[0][0];
		var xb = $('#xbound').val();
		var yb = $('#ybound').val();
		var left1 = job[0][1] < xb;
		var left2 = job[0][4] < xb;
		var down1 = job[0][2] < yb;
		var down2 = job[0][5] < yb;
		var xlat1 = 0,
		    ylat1 = 0,
		    xlat2 = 0,
		    ylat2 = 0;
		var xcross1 = 0,
		    ycross1 = 0,
		    xcross2 = 0,
		    ycross2 = 0;

		//vars for moving/still
		var moveAllowed = $('#moving').val();
		var moveTime = $('#still').val();
		var prevx1 = job[0][1];
		var prevy1 = job[0][2];
		var prevx2 = job[0][4];
		var prevy2 = job[0][5];
		var prevTime = job[0][0];
		var moving1 = 0;
		var moving2 = 0;
		var still1 = 0;
		var still2 = 0;
		var moveRatio = moveAllowed / moveTime;

		//vars for exterior
		var interior1 = 0;
		var exterior1 = 0;
		var interior2 = 0;
		var exterior2 = 0;
		var extRange = $('#tankHeight').val() * $('#exterior').val() / 100.0;

		//vars for point of interest
		var poix = $('#xpoint').val();
		var poiy = $('#ypoint').val();
		var radius = $('#rpoint').val();
		//is within poi
		var withinpoi1 = calcDist(prevx1, prevy1, poix, poiy) <= radius;
		var withinpoi2 = calcDist(prevx2, prevy2, poix, poiy) <= radius;
		//start fish enter
		var withinstart1 = withinpoi1 ? 0 : -1;
		var withinstart2 = withinpoi2 ? 0 : -1;
		//time in poi
		var within1 = 0;
		var within2 = 0;
		//time til enter 1st time
		var poilat1 = withinpoi1 ? 0 : -1;
		var poilat2 = withinpoi2 ? 0 : -1;
		//count times enter poi
		var poi1 = withinpoi1 ? 1 : 0;
		var poi2 = withinpoi2 ? 1 : 0;
		var tempd1,
		    tempd2;

		//record the each fish spends in each cell
		var cellnum1,
		    cellnum2,
		    prev1 = -1,
		    prev2 = -1;
		var start1 = -1,
		    start2 = -1,
		    diff;
		console.log(job);
		for ( l = 0; l < job.length; l++) {
			x1=job[l][1];
			y1=job[l][2];
			x2=job[l][4];
			y2=job[l][5];

			//cell calc
			if (start1 == -1) {
				start1 = job[l][0];
			}
			if (start2 == -1) {
				start2 = job[l][0];
			}
			cellnum1 = Math.floor(x1 / cellWidth) + (((wD-1)*Math.floor(y1 / cellHeight)) + Math.floor(y1 / cellHeight));
			cellnum2 = Math.floor(x2 / cellWidth) + (((wD-1)*Math.floor(y2 / cellHeight)) + Math.floor(y2 / cellHeight));
			//console.log(cellnum1+' '+prev1);
			if (cellnum1 != prev1 && prev1 != -1) {
				diff = job[l][0] - start1;
				cells1[prev1] += diff;
				start1 = -1;
				cell1b.push([prev1 + 1, cellnum1 + 1]);
			}
			if (cellnum2 != prev2 && prev1 != -1) {
				diff = job[l][0] - start2;
				cells2[prev2] += diff;
				start2 = -1;
				cell2b.push([prev2 + 1, cellnum2 + 1]);
			}
			prev1 = cellnum1;
			prev2 = cellnum2;

			//moving/still
			//fish 1
			if (((job[l][0] - prevTime) / 1000) != 0 && calcDist(x1, y1, prevx1, prevy1) / ((job[l][0] - prevTime) / 1000) >= moveRatio) {
				moving1 += job[l][0] - prevTime;
			} else {
				still1 += job[l][0] - prevTime;
			}
			//fish 2
			if (((job[l][0] - prevTime) / 1000) != 0 && calcDist(x2, y2, prevx2, prevy2) / ((job[l][0] - prevTime) / 1000) >= moveRatio) {
				moving2 += job[l][0] - prevTime;
			} else {
				still2 += job[l][0] - prevTime;
			}
			prevx1 = x1;
			prevy1 = y1;
			prevx2 = x2;
			prevy2 = y2;

			//near exterior
			//fish 1
			if (x1 < extRange || x1 > tW - extRange || y1 < extRange || y1 > tH - extRange) {
				exterior1 += job[l][0] - prevTime;
			} else {
				interior1 += job[l][0] - prevTime;
			}
			//fish 2
			if (x2 < extRange || x2 > tW - extRange || y2 < extRange || y2 > tH - extRange) {
				exterior2 += job[l][0] - prevTime;
			} else {
				interior2 += job[l][0] - prevTime;
			}

			//near POI
			tempd1 = calcDist(x1, y1, poix, poiy);
			tempd2 = calcDist(x2, y2, poix, poiy);
			//fish1
			if (withinpoi1) {
				if (tempd1 > radius) {
					within1 += job[l][0] - withinstart1;
					withinpoi1 = false;
				}
			} else {
				if (tempd1 <= radius) {
					withinpoi1 = true;
					poi1++;
					if (poilat1 == -1) {
						poilat1 = job[l][0] - 0;
					}
					withinstart1 = job[l][0];
				}
			}
			//fish2
			if (withinpoi2) {
				if (tempd2 > radius) {
					within2 += job[l][0] - withinstart2;
					withinpoi2 = false;
				}
			} else {
				if (tempd2 <= radius) {
					withinpoi2 = true;
					poi2++;
					if (poilat2 == -1) {
						poilat2 = job[l][0] - 0;
					}
					withinstart2 = job[l][0];
				}
			}

			//boundary crossing calc
			//fish1 x boundary
			if (left1 && !x1 < xb) {//crossed left to right
				if (xlat1 == 0) {
					xlat1 = job[l][0] - startTime;
				}
				xcross1++;
			} else if (!left1 && x1 < xb) {//crossed right to left
				if (xlat1 == 0) {
					xlat1 = job[l][0] - startTime;
				}
				xcross1++;
			}
			//fish1 y boundary
			if (down1 && !y1 < yb) {//crossed down to up
				if (ylat1 == 0) {
					ylat1 = job[l][0] - startTime;
				}
				ycross1++;
			} else if (!down1 && y1 < yb) {//crossed up to down
				if (ylat1 == 0) {
					ylat1 = job[l][0] - startTime;
				}
				ycross1++;
			}
			//fish2 x boundary
			if (left2 && !x2 < xb) {//crossed left to right
				if (xlat2 == 0) {
					xlat2 = job[l][0] - startTime;
				}
				xcross2++;
			} else if (!left2 && x2 < xb) {//crossed right to left
				if (xlat2 == 0) {
					xlat2 = job[l][0] - startTime;
				}
				xcross2++;
			}
			//fish2 y boundary
			if (down2 && !y2 < yb) {//crossed down to up
				if (ylat2 == 0) {
					ylat2 = job[l][0] - startTime;
				}
				ycross2++;
			} else if (!down2 && y2 < yb) {//crossed up to down
				if (ylat2 == 0) {
					ylat2 = job[l][0] - startTime;
				}
				ycross2++;
			}

			prevTime = job[l][0];

			if(job[l][0]==117543){
				console.log('#######');
				console.log(job[l][1] +' '+job[l][2]);
				console.log(prev1);
			}
		}
		diff = job[job.length-1][0] - start1;
		cells1[prev1] += diff;
		cell1b.push([prev1 + 1, cellnum1 + 1]);

		diff = job[job.length-1][0] - start2;
		cells2[prev2] += diff;
		cell2b.push([prev2 + 1, cellnum2 + 1]);

		console.log(cell1b);

		console.log('*********************');
		//debugging for cell amount
		for(i=0;i<cells1.length;i++){
			console.log((cells1[i]/1000.0).toFixed(2));
		}//*/
		console.log('*********************');
		//debugging boundary
		//console.log(xcross1+' '+xcross2+' '+ycross1+' '+ycross2);
		//console.log(xlat1+' '+ylat1+' '+xlat2+' '+ylat2);

		var total_time = moving1 + still1;
		var movingProp1 = (moving1 / total_time).toFixed(2);
		var stillProp1 = (still1 / total_time).toFixed(2);
		var intProp1 = (interior1 / total_time).toFixed(2);
		var extProp1 = (exterior1 / total_time).toFixed(2);

		//data to csv format
		if (name2 != '') {
			var movingProp2 = (moving2 / total_time).toFixed(2);
			var stillProp2 = (still2 / total_time).toFixed(2);
			var intProp2 = (interior2 / total_time).toFixed(2);
			var extProp2 = (exterior2 / total_time).toFixed(2);
			//exportInfo=exportInfo+'Job_1,'+name1+',';
			exportInfo += pad(name1, PADDING_AMT, comma = false) + pad(toSec(moving1)) + pad(toSec(still1)) + pad(movingProp1) + pad(stillProp1) + pad(toSec(xlat1)) + pad(xcross1) + pad(toSec(ylat1)) + pad(ycross1);
			exportInfo += pad(toSec(interior1)) + pad(toSec(exterior1)) + pad(intProp1) + pad(extProp1) + pad(toSec(poilat1)) + pad(toSec(within1)) + pad(poi1) + pad(cell1b.length) + pad((cell1b.length / toSec(total_time)).toFixed(2));
			for ( c = 0; c < hD * wD; c++) {
				exportInfo += pad(toSec(cells1[c]));
			}
			for ( c = 0; c < hD * wD; c++) {
				exportInfo += pad((cells1[c] / total_time).toFixed(2));
			}
			exportInfo += '\n';
			exportInfo += pad(name2, PADDING_AMT, comma = false) + pad(toSec(moving2)) + pad(toSec(still2)) + pad(movingProp2) + pad(stillProp2) + pad(toSec(xlat2)) + pad(xcross2) + pad(toSec(ylat2)) + pad(ycross2);
			exportInfo += pad(toSec(interior2)) + pad(toSec(exterior2)) + pad(intProp2) + pad(extProp2) + pad(toSec(poilat2)) + pad(toSec(within2)) + pad(poi2) + pad(cell2b.length) + pad((cell2b.length / toSec(total_time)).toFixed(2));
			for ( c = 0; c < hD * wD; c++) {
				exportInfo += pad(toSec(cells2[c]));
			}
			for ( c = 0; c < hD * wD; c++) {
				exportInfo += pad((cells2[c] / total_time).toFixed(2));
			}
			exportInfo += '\n';
		} else {
			exportInfo += pad(name1, PADDING_AMT, comma = false) + pad(toSec(moving1)) + pad(toSec(still1)) + pad(movingProp1) + pad(stillProp1) + pad(toSec(xlat1)) + pad(xcross1) + pad(toSec(ylat1)) + pad(ycross1);
			exportInfo += pad(toSec(interior1)) + pad(toSec(exterior1)) + pad(intProp1) + pad(extProp1) + pad(toSec(poilat1)) + pad(toSec(within1)) + pad(poi1) + pad(cell1b.length) + pad((cell1b.length / toSec(total_time)).toFixed(2));
			for ( c = 0; c < hD * wD; c++) {
				exportInfo += pad(toSec(cells1[c]));
			}
			for ( c = 0; c < hD * wD; c++) {
				exportInfo += pad((cells1[c] / total_time).toFixed(2));
			}
			exportInfo += '\n';
		}
	}
	var d = new Date();
	csvFileName = d.toLocaleDateString().replace(/\//g, '_') + '_';
	if (fileContent.length == 1)
		csvFileName += "1file.csv";
	else
		csvFileName = csvFileName + fileContent.length + 'files.csv';
	console.log(csvFileName);
	console.log(exportInfo);
	exportInfo = exportInfo.replace(/\n/g, "\r\n");
	var downloadContent = new Blob([exportInfo], {
		type : 'text/csv'
	});
	url = window.URL.createObjectURL(downloadContent);
	$('#download').attr('href', url);
	$('#download').attr('download', csvFileName);
}

function readmultifiles(files) {
	fileContent = [];
	fileNames = [];
	globalFiles = files;
	var reader = new FileReader();
	var temp,
	    ntemp;
	function readFile(index) {
		ntemp = [];
		if (index >= files.length)
			return;

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
						console.log('Error reading:' + file.name + ' at line ' + i);
					}
				} else {
					ntemp.push(t);
				}
			}
			fileContent.push(ntemp);

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
