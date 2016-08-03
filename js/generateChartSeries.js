function randomRGBValue(){
  return Math.floor(Math.random()*256);
}
function genScatter(jobs,trials){
  var series=[];
  var r,g,b;
  var seriesTemp1={},seriesTemp2={};
  var temp1=[],temp2=[];
  var data1=[],data2=[];
  for(j=0;j<jobs.length;j++){
    var job=jobs[j];
    for(i=0;i<job.length;i++){
      curr=job[i];
      temp1.push(curr[1],curr[0]/1000.0);
      temp2.push(curr[4],curr[0]/1000.0);
      data1.push(temp1);
      data2.push(temp2);
      temp1=[];
      temp2=[];
    }
    r=randomRGBValue();
    g=randomRGBValue();
    b=g;
    seriesTemp1.name=trials[(j*2)];
    seriesTemp1.color='rgba('+r+','+g+','+b+',.5)';
    seriesTemp1.data=data1;
    r=randomRGBValue();
    g=randomRGBValue();
    b=r;
    seriesTemp2.name=trials[(j*2)+1];
    seriesTemp2.color='rgba('+r+','+g+','+b+',.5)';
    seriesTemp2.data=data2;
    series.push(seriesTemp1);
    series.push(seriesTemp2);
    data1=[];
    data2=[];
  }
  return series;
}
function genBar(exportInfo){
  var series=[];
  var trial={};
  var t;
  var nums;
  var temp=exportInfo.split('\r\n');
  temp.splice(0,1);
  if(temp[temp.length-1]=='')
    temp.splice(temp.length-1,1);
  for(i=0;i<temp.length;i++){
    t=temp[i].split(',');
    trial.name=t[1];
    nums=t.slice(2);
    for(j=0;j<nums.length;j++){
      nums[j]=parseFloat(nums[j]);
    }
    trial.data=nums;
    series.push(jQuery.extend(true, {}, trial));
  }
  return series;
}
function genSpider(exportInfo){
  var series=[];
  var trial={};
  var t;
  var nums;
  var temp=exportInfo.split('\r\n');
  temp.splice(0,1);
  if(temp[temp.length-1]=='')
    temp.splice(temp.length-1,1);
  for(i=0;i<temp.length;i++){
    t=temp[i].split(',');
    trial.name=t[1];
    nums=t.slice(2);
    for(j=0;j<nums.length;j++){
      nums[j]=parseFloat(nums[j]);
    }
    trial.data=nums;
    trial.pointPlacement='on';
    series.push(jQuery.extend(true, {}, trial));
  }
  return series;
}
function getTrialNames(exportInfo){
  var trial=[];
  var temp=exportInfo.split('\r\n');
  temp.splice(0,1);
  if(temp[temp.length-1]=='')
    temp.splice(temp.length-1,1);
  for(i=0;i<temp.length;i++){
    t=temp[i].split(',');
    trial.push(t[1]);
  }
  return trial;
}
function genStacked(exportInfo,zoneLabels){
  var series=[];
  var trial={};
  var t;
  var nums;
  var temp=exportInfo.split('\r\n');
  temp.splice(0,1);
  if(temp[temp.length-1]=='')
    temp.splice(temp.length-1,1);
  for(i=0;i<zoneLabels.length;i++){
    trial.name=zoneLabels[i];
    trial.data=[];
    for(j=0;j<temp.length;j++){
      t=temp[j].split(',');
      t.splice(0,2);
      nums=trial.data;
      nums.push(parseFloat(t[i]));
      trial.data=nums;
    }
    series.push(jQuery.extend(true, {}, trial));
  }
  return series;
}
