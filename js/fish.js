var fileContent;
var fileNames;
var listOfTrials;
var csvFileName;
var url;
var exportInfo;
var zones=[];

function getZones(){
  zones=[];
  var z=$('#zoneDiv tr').length-1;
  for(q=0;q<z;q++){
    zones.push($('#'+q+'max').val()-$('#'+q+'min').val());
  }
}
//on load
$(function() {
  //initial table creation
  $('#tankDiv').html('');
  var tH=$('#tankHeight').val();
  var tW=$('#tankWidth').val();
  var hD=$('#heightDiv').val();
  var wD=$('#widthDiv').val();
  
  $('#tankDiv').attr('width',tW);
  var row='';
  var cell=1;
  for(i=0;i<hD;i++){
		row='<tr>';
		for(var j=0;j<wD;j++){
			row+='<td height='+(tH/hD)+' id=cell'+cell+'>Cell-'+cell+'</td>';
			cell++;
		}
		row+='</tr>';
		$('#tankDiv').append(row);
  }
  
  getZones();
  //change tank height
  $('#tankWidth,#tankHeight,#widthDiv,#heightDiv').change(function(){
    $('#tankDiv').html('');
	var tH=$('#tankHeight').val();
	var tW=$('#tankWidth').val();
	var hD=$('#heightDiv').val();
	var wD=$('#widthDiv').val();
  
	$('#tankDiv').attr('width',tW);
	var row='';
	var cell=1;
	for(i=0;i<hD;i++){
		row='<tr>';
		for(var j=0;j<wD;j++){
			row+='<td height='+(tH/hD)+' id=cell'+cell+'>Cell-'+cell+'</td>';
			cell++;
		}
		row+='</tr>';
		$('#tankDiv').append(row);
	}
    getZones();
  });
  //if user changes # of zones or width of zones can recalculate time in each, without re-upload
  $('#calculate').on('click',function(){
    if(fileContent!=undefined&&fileContent.length>0){
      listOfTrials=[];
      $('#chartType').val('');
      calculate(false);
    }
  });
  //clear other file input, so user knows what they are viewing
  $('input[type=file]').on('change',function(){
    var butId=$(this).attr('id');
    var controlFile=$('#fileSelect');
    var controlFolder=$('#folderSelect');
    if(butId=='fileSelect'){
      controlFolder.replaceWith(controlFolder=controlFolder.clone(true));
    }else{
      controlFile.replaceWith(controlFile=controlFile.clone(true));
    }
    //download change icon, title, name
    $('#downloadImg').attr('src','img/download.png');
    $('#download').attr('title','Download fish tracking data');
    $('#download').attr('name','download');
    //ability to draw chart
    $('#chartArea').html('');
    $('#chartType').val('');
    $('#chartType').attr('disabled',false);
	//enable button
	$('#calculate').attr('disabled',false);
	$('#calculate').attr('title','Track that fish!');
	
  });
  $('#chartType').on('change',function(){
    var chart=$(this).val();
    console.log(chart);
    if(fileContent.length>0){
      drawChart(chart);
    }
  });
});
//choose which chart to draw
function drawChart(chart){
  var zoneLabels=exportInfo.substring(22,exportInfo.indexOf('\r\n')).split(',');
  if(chart=='scatter'){
    console.log(fileContent.length+' '+listOfTrials.length);
    //console.log(JSON.stringify(genScatter(fileContent,listOfTrials)));
    $('#chartArea').highcharts({
      chart:{type:'scatter',zoomType:'xy'},
      title:{text:'Position v Time'},
      subtitle:{text:csvFileName},
      xAxis:{title:{enabled:true,text:'Position (cm)'},startOnTick:true,endOnTick:true,showLastLabel:true},
      yAxis:{title:{text:'Time (sec)'}},
      legend:{layout: 'vertical',align: 'left',verticalAlign: 'top',x: 100,y: 70,floating: true,backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',borderWidth: 1},
      plotOptions:{
        scatter: {
          marker: {
            radius: 5,
            states: {hover: {enabled: true,lineColor: 'rgb(100,100,100)'}}
          },
          states: {hover: {marker: {enabled: false}}},
          tooltip: {
            headerFormat: '<b>{series.name}</b><br>',
            pointFormat: '{point.x} cm, {point.y} sec'
          }
        }
      },
      series:genScatter(fileContent,listOfTrials)
    });
  }else if(chart=='spider'){
    $('#chartArea').highcharts({
      chart: {polar: true,type: 'line'},
      title: {text: 'Time vs Zone',x: -80},
      pane: {size: '80%'},
      xAxis: {categories: zoneLabels,tickmarkPlacement: 'on',lineWidth: 0},
      yAxis: {gridLineInterpolation: 'polygon',lineWidth: 0,min: 0},
      tooltip: {shared: true,pointFormat: '<span style="color:{series.color}">{series.name}: <b>{point.y:,.2f} sec</b><br/>'},
      legend: {align: 'right',verticalAlign: 'top',y: 70,layout: 'vertical'},
      series: genSpider(exportInfo)
    });
  }else if(chart=='bar'){
    $('#chartArea').highcharts({
      chart: {type: 'column'},
        title: {text: 'Zone Time Comparison'},
        subtitle: {text: csvFileName},
        xAxis: {categories: zoneLabels,crosshair: true},
        yAxis: {min: 0,title: {text: 'Time (sec)'}},
        tooltip: {
            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                '<td style="padding:0"><b>{point.y:.1f} sec</b></td></tr>',
            footerFormat: '</table>',
            shared: true,
            useHTML: true
        },
        plotOptions: {column: {pointPadding: 0.2,borderWidth: 0}},
        series: genBar(exportInfo)
    });
  }else if(chart=='stacked'){
    $('#chartArea').highcharts({
      chart: {type: 'column'},
        title: {text: 'Combined Zone Time, by trial'},
        xAxis: {categories: getTrialNames(exportInfo)},
        yAxis: {allowDecimals: true,min: 0,  title: {text: 'Time (sec)'}},
        tooltip: {
            formatter: function () {
                return '<b>' + this.x + '</b><br/>' +
                    this.series.name + ': ' + this.y + '<br/>' +
                    'Total: ' + this.point.stackTotal +'sec';
            }
        },
        plotOptions: {column: {stacking: 'normal'}},
        series: genStacked(exportInfo,zoneLabels)
    });
  }
}
//calculate time each job spends per zone
function calculate(checkForNegatives){
  var job,job1x,job1y,job2x,job2y;
  var time1start=-1,time1stop=-1,time2start=-1,time2stop=-1;
  var diff1,diff2,total1,total2;
  var hunt1=false, hunt2=false;
  var real1,real2,preal1,preal2;
  var name1,name2;
  //csv header
  exportInfo='Job_Number,Trial_Name,';
  for(z=0;z<zones.length;z++){
    exportInfo=exportInfo+String.fromCharCode(65+z);
    if(z+1<zones.length)
      exportInfo+=',';
  }
  exportInfo+='\n';
  //for each file
  for(i=0;i<fileContent.length;i++){
    job=fileContent[i];
    console.log('working on:'+fileNames[i]);
    var split=fileNames[i].indexOf('-');
    if(split>0){
      name1=fileNames[i].substring(0,split);
      name2=fileNames[i].substring(split+1);
      listOfTrials.push(name1);
      listOfTrials.push(name2);
    }else{
      name1=fileNames[i];
      name2='';
      listOfTrials.push(name1);
    }
    if(job[0][1]==-1)
      hunt1=true;
    if(job[0][4]==-1)
      hunt2=true;
    //get rid of negative numbers
    if(checkForNegatives){
      for(t=0;t<job.length;t++){
        real1=job[t][1];
        real2=job[t][4];
        if(hunt1&&real1!=-1){
          for(x=i;x>=0;x--){
            job[x][1]=real1;
          }
          hunt1=false;
        }else if(!hunt1&&real1==-1){
          job[t][1]=preal1;
          real1=preal1;
        }
        if(hunt2&&real2!=-1){
          for(x=i;x>=0;x--){
            job[x][4]=real2;
          }
          hunt2=false;
        }else if(!hunt2&&real2==-1){
          job[t][4]=preal2;
          real2=preal2;
        }
        preal1=real1;
        preal2=real2;
      }
    }
	
	//console.log(job);
	
	
    /*var total1=0,total2=0,diff;zoneTime1=[],zoneTime2=[];
    var start1=-1,start2=-1,end1,end2,lowerBound=0;
    //zonify
    for(p=0;p<$('#sections').val();p++){
      //read each line of file find job times for current zone
      for(t=0;t<job.length;t++){
        if(job[t][1]>=lowerBound&&job[t][1]<lowerBound+zones[p]&&start1==-1){
          start1=job[t][0];
        }else if((job[t][1]<lowerBound||job[t][1]>=lowerBound+zones[p])&&start1!=-1){
          diff=job[t][0]-start1;
          total1+=diff;
          start1=-1;
        }
        if(job[t][4]>=lowerBound&&job[t][4]<lowerBound+zones[p]&&start2==-1){
          start2=job[t][0];
        }else if((job[t][4]<lowerBound||job[t][4]>=lowerBound+zones[p])&&start2!=-1){
          diff=job[t][0]-start2;
          total2+=diff;
          start2=-1;
        }
      }
      if(start1!=-1){
        diff=job[job.length-1][0]-start1;
        total1+=diff;
        start1=-1;
      }
      if(start2!=-1){
        diff=job[job.length-1][0]-start2;
        total2+=diff;
        start2=-1;
      }
      zoneTime1.push((total1/1000.0).toFixed(2));
      zoneTime2.push((total2/1000.0).toFixed(2));
      total1=0;
      total2=0;
      lowerBound+=zones[p];
    }*/
    //data to csv format
    if(name2!=''){
      exportInfo=exportInfo+'Job_1,'+name1+',';
      for(z=0;z<zones.length;z++){
        exportInfo=exportInfo+zoneTime1[z];
        if(z+1<zones.length)
          exportInfo+=',';
      }
      exportInfo+='\n';
      exportInfo=exportInfo+'Job_2,'+name2+',';
      for(z=0;z<zones.length;z++){
        exportInfo=exportInfo+zoneTime2[z];
        if(z+1<zones.length)
          exportInfo+=',';
      }
      exportInfo+='\n';
    }else{
      exportInfo=exportInfo+'Job_1,'+name1+',';
      for(z=0;z<zones.length;z++){
        exportInfo=exportInfo+zoneTime1[z];
        if(z+1<zones.length)
          exportInfo+=',';
      }
    }
    /*console.log(exportInfo);
    console.log(zoneTime1);
    console.log(zoneTime2);*/
  }
  var d=new Date();
  csvFileName=d.toLocaleDateString().replace(/\//g,'_')+'_';
  if(fileContent.length==1)
    csvFileName+="1file.csv";
  else
    csvFileName=csvFileName+fileContent.length+'files.csv';
  console.log(csvFileName);
  console.log(exportInfo);
  exportInfo = exportInfo.replace(/\n/g, "\r\n");
  var downloadContent=new Blob([exportInfo],{type: 'text/csv'});
  url=window.URL.createObjectURL(downloadContent);
  $('#download').attr('href',url);
  $('#download').attr('download',csvFileName);
}
function readmultifiles(files) {
  fileContent=[];
  fileNames=[];
  globalFiles=files;
  var reader = new FileReader();
  var temp,ntemp;
  function readFile(index) {
    ntemp=[];
    if( index >= files.length ) return;

    var file = files[index];
    fileNames.push(file.name);
    reader.onload = function(e) {
      // get file content
      var bin = e.target.result;
      //break file content by line breaks
      temp=bin.match(/[^\r\n]+/g);
      for(i=0;i<temp.length;i++){
        //break each line by spaces
        t=temp[i].split(/\s+/);
        //if not 7 values check **TODO: add checks for various number columns
        if(t.length!=7){
          var diff=t.length-7;
          if(diff%3==0)
            t.splice(3,diff);
          else
            console.log('Error reading:'+file.name+' at line '+i);
        }else{
          ntemp.push(t);
        }
      }
      fileContent.push(ntemp);

      readFile(index+1);
      if(fileContent.length==files.length){
        listOfTrials=[];
        calculate(true);
      }
    }
    reader.readAsText(file);
  }
  readFile(0);
}
