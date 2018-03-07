'use strict';
 
angular.module('growApp.home', ['ui.bootstrap','ui.select', 'ngSanitize','ngAnimate','cp.ngConfirm','ngRoute','firebase'])
 
// Declared route 
.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/home', {
        templateUrl: '/app/home/home.html',
        controller: 'BloxController',
        controllerAs: 'BloxCtrl'
    });
}])




 
// Home controller
.controller('BloxController',['$scope', '$http', '$templateCache', '$sce','$location','$timeout','$window','$filter','$sanitize','$ngConfirm',
            function($scope, $http, $templateCache,$sce,$location,$timeout,$window,$filter,$sanitize,$ngConfirm) {

            $scope.LogOut = function(e) {
                  firebase.auth().signOut().then(function() {
                  // Sign-out successful.
                  }).catch(function(error) {
                    // An error happened.
                  });
            }


            var database = firebase.database();

            $scope.loading=false;

          
           
            

          	/* global variables */
            var currentDate=new Date();
          	var grow = this;
            grow.uid=0;
            grow.loaded=false;
            grow.currentMonth=currentDate.getMonth();
            grow.currentYear=currentDate.getFullYear();
          	grow.plants = [];
            grow.seasons=[{}];
            
            grow.saveLabel="Save";
            grow.summerMonths=["October","November","December","January","February","March"];
            grow.winterMonths=["April","May","June","July","August","September"];
            grow.allMonths=["January","February","March","April","May","June","July","August","September","October","November","December"]
            
            grow.firstplant=false;
            grow.showSeedlings=true;
            grow.settings={};
            /*grow.settings.seenThumbsDown=false;
            grow.settings.seenRedCalendar=false;
            grow.settings.seenRecommended=false;*/

            grow.cellWidth=240;

              firebase.auth().onAuthStateChanged(function(user) {
              if (user) {
                 
                  grow.uid= user.uid;
                  console.log(user);
                  console.log("User is signed in."+grow.uid);
                $scope.loading=true;
                $location.path('/home');
                  grow.loadPlants();
                $scope.$evalAsync()
              } else {
                console.log("No user is signed in.");
                $location.path('/login');
              }
            });
            
            grow.dynamicPopover = {
                  content: 'Hello, World!',
                  templateUrl: '/templates/popoverTemplate.html',
                  title: 'Title'
            };

            $window.addEventListener("beforeunload", function (e) {
              var confirmationMessage = "\o/";
              console.log("closing the tab so do your small interval actions here like cookie removal etc but you cannot stop customer from closing");
              (e || window.event).returnValue = confirmationMessage; //Gecko + IE
              return confirmationMessage;                            //Webkit, Safari, Chrome
            });

            this.LogOutPrompt=function(){

              $ngConfirm({
                    theme:'modern',
                  title: 'Warning',
                  type: 'red',
                  content: 'Are you sure you want to logout? All data changed and not saved will be lost.',
                  scope: $scope,
                  buttons: {
                    Logout: {
                        text: "Discard changes",
                        btnClass: 'btn-danger',
                        action: function(scope, button){
                            $scope.LogOut(event);
                            return true; // prevent close;
                        }
                    },
                    Save: {
                        text: "Save and Logout",
                        btnClass: 'btn-primary',
                        action: function(scope, button){
                            grow.saveData(true)
                            return true; // prevent close;
                        }
                    },
                    Cancel: {
                        text: "Cancel",
                        btnClass: 'btn-grey',
                        action: function(scope, button){
                            
                            return true; // prevent close;
                        }
                    },
                }
            });
            }

            this.showAlert=function(alertContent){


              $ngConfirm({
                theme:'modern',
              title: 'A little tip for you',
              content: alertContent,
              scope: $scope,
              buttons: {
                sayBoo: {
                    text: 'Cool, thanks',
                    btnClass: 'btn-blue',
                    action: function(scope, button){
                        
                        return true; // prevent close;
                    }
                },
            }
        });
        }      
           
            

              /* Initial load */
            this.loadPlants=function(){  
                	$http.get("/data/plant_data.json").success(function(data){        	
                  	grow.plants=data;
                        console.log('plants loaded');
                        console.log(grow.plants)

                        grow.loadBlox();
                	}); 
            }

            
              
             this.loadBlox=function(){

              
                  
                  var ref = firebase.database().ref('/plans/' + grow.uid);
                  ref.once("value")
                    .then(function(snapshot) {
                  
                      
                              grow.seasons=JSON.parse(snapshot.child("plan").val());
                              grow.settings=JSON.parse(snapshot.child("settings").val());
                              if(grow.settings==null) grow.settings={'seenRedCalendar':false, 'seenThumbsDown':false, 'seenRecommended':false};
                              grow.loaded=true;
                              console.log('plan loaded from Firebase'+grow.loaded);
                              console.dir(snapshot); 
                              if(snapshot.child("plan").exists()){
                                   
                                     grow.checkPast();
                                      grow.initialiseSeedlings();
                              }     
                              else{                        
                              grow.createNewList();
                         }
                        

                    });


               
                        
                	/*$http.get("/data/blox_data_1.json").success(function(data){            
                              grow.seasons=data;
                              grow.loaded=true;
                              console.log('plan loaded from file');
                              console.dir(data);
                               grow.checkPast();
                        
                        
                        });  */
             }

             this.createNewList=function(){

                  console.log("Creating new list");
                  $http.get("/data/blox_empty.json").success(function(data){            
                              grow.seasons=data;        
                              grow.seasons[0].year=grow.currentYear-2;                   
                              // for(var i=0;i<6;i++){                                    
                              //       grow.seasons[0].blox[0].months.push({"plant": {"id": ""},"info": {"status": ""}});
                              // }
                              grow.addBlox(grow.seasons[0])


                              grow.loaded=true;
                              grow.showAlert("<p>Start by changing the name and dimensions of your first growing area by clicking on the <span class='editLink fa fa-edit'></span> icon below the area name</p>");
                        
                        
                        });
             }


             this.checkPast=function(){
                  $scope.$evalAsync();
                 //console.log(grow.seasons.length);
                    for (var i = 0; i < grow.seasons.length; i++) {
                        var season=grow.seasons[i];
                        var year=season.year;
                        
                        // First check if the whole season is in the past                        
                       if(year<grow.currentYear)  {
                             for (var j = 0; j < season.bloxs.length; j++) { 
                                    var blox=season.bloxs[j];
                                    for (var k=0; k<blox.months.length; k++){
                                          blox.months[k].past="pastCell";
                                    }
                             }
                        }else if(year==grow.currentYear){


                        } else{
                            for (var j = 0; j < season.bloxs.length; j++) { 
                                    var blox=season.bloxs[j];
                                    for (var k=0; k<blox.months.length; k++){
                                          blox.months[k].past="currentCell";
                                    }
                             }  
                        }
                  } 
                  //console.log("past checked");
             }

             this.getFullWidth=function(){
                  
                  if(grow.seasons!=null){
                   	if(grow.seasons[0].bloxs){
                   		var width= (grow.seasons[0].bloxs.length);
                   		width+=3;
                   		width=width*grow.cellWidth+180;


                      if(grow.showSeedlings==false) width-=210;
                        
                   		return width;
                      $scope.$evalAsync();
                   	}
                  }
             }

             
             this.testFunction=function(object){
             		console.log (object);
             }

             this.getMonthsNames=function(seasonType){
             		if(seasonType=="Summer"){
             			return grow.summerMonths;
             		}
             		else{
             			return grow.winterMonths;
             		}
             }

             

             this.editMonthToggle=function(month){
             		if(month.edit) {
             			month.edit=false;
             		}else{
             			month.edit=true;
             		}
                        //$scope.$evalAsync();
             }

             this.companionMonthToggle=function(month,index){

              if(index==1){
                if(month.companionEdit1==true){
                  month.companionEdit1=false
                }else{
                  month.companionEdit1=true
                }
              }else if(index==2){
                if(month.companionEdit2==true){
                  month.companionEdit2=false
                }else{
                  month.companionEdit2=true
                }
              }else{

                if(month.info.plant[1]==undefined || angular.equals(month.info.plant[1],{})){
                    if(month.companionEdit1==true){
                    month.companionEdit1=false
                  }else{
                    month.companionEdit1=true
                  
                  }
                  
                }else{
                   if(month.companionEdit2==true){
                      month.companionEdit2=false
                    }else{
                      month.companionEdit2=true
                    }
                }
              }
                      
             }



             this.checkMonth=function(blox,month,plant,season){

                  if(plant){
                   	/* Check if good to plant in this month */
                   		var index=blox.months.indexOf(month);
                   	/* Working out the offset based on the season*/	
                   		if(season.type=="Winter"){
                   			index+=3;
                   		}else{
                   			if(index<3) {
                   				index+=9;
                   			}else{
                   				index-=3;
                   			}

             		}

                if(plant.plantingMonths){
               		if(plant.plantingMonths.indexOf(index)>=0){
            				return "calendar-check-o greenicon";
                   		}else{
                        if(!grow.settings.seenRedCalendar){
                          grow.settings.seenRedCalendar=true;
                          grow.showAlert("<p>Lookout for the <span class='fa fa-calendar-times-o redicon'></span> icon next to a plant. It means this is not the ideal month to plant this.<br> Up to you though!</p>");
                        }
                   			return "calendar-times-o redicon";
                   		}
                        }
               		 
               }
           }

             this.getMonthsList=function(plant){
                  var returnString="<h4>Best planted in:</h4>";
                  //console.log (plant);
                  for (var i=0; i<plant.plantingMonths.length; i++){
                        var index=plant.plantingMonths[i];
                        returnString+=grow.allMonths[index]+"<br>";
                  }
                  return returnString;
             }

             this.getCurrentMonth=function(season,month){                  
                  var year=season.year;
                  
                  
                  if(season.type=="Summer"){
                        var index=grow.summerMonths.indexOf(month);
                  }else{
                        var index=grow.winterMonths.indexOf(month);
                  }

                  if(season.type=="Winter"){
                        index+=3;
                  }else{
                        if(index<3) {
                              index+=9;
                        }else{
                              index-=3;
                              year++
                        }
                  }
                  if(year<grow.currentYear) {
                        return "pastCell";
                  }else{
                        if(index<grow.currentMonth && year==grow.currentYear) {
                              return "pastCell";
                        }else{

                             return "currentCell";
                              
                              
                              
                        }
                  }
             }

            

             

             this.getCurrentSeason=function(season){
                 
                 var year=season.year;
                 if(year<grow.currentYear)  {
                  return "pastCell";
                  }else if(year==grow.currentYear){                        
                        if(season.type=="Winter"){
                              if(grow.currentMonth>3) {
                                    return "pastCell";
                              }else{
                                    return "currentCell";
                              }
                        }else{
                              if(grow.currentMonth>9 ) {
                                    return "pastCell";
                              }else{
                                    return "currentCell";
                              }
                        }
                  }else{
                        return "currentCell";
                  }

             }


            this.toggleSeason=function(season){
                  if(season.visible==false) {
                        season.visible=true;
                        if (grow.getCurrentSeason(season)=="pastCell"){
                              
                                               
                        };
                              
                   }else{
                        season.visible=false;
                        
                        var year=season.year;
                      
                        if(year<grow.currentYear){
                              
                        };
                              
                  }


             }

             this.checkRecommended=function(month){
                  if(month.info.plant && month.info.status=='start' &&month.info.recommended){
                      if(month.info.recommended!=""){
                        var index=month.info.recommended.indexOf(month.info.plant[0].category);
                        if(index>-1){
                          return "";
                        }else{
                          //console.log(month)
                          //console.log("thumbs-down")
                          if(!grow.settings.seenThumbsDown){
                            grow.showAlert("The <span class='fa fa-thumbs-o-down redicon'></span> icon you see next to your plant means it's not the recommended category to follow what you previously had in there. All good though, can't have it working perfectly all the time!");
                            grow.settings.seenThumbsDown=true;
                          }
                          return "thumbs-o-down redicon";
                        }
                      }
                  }
             }

             this.getRecommendedList=function(month){
                  var result="";
               
                  if(month.info.recommended){
                          
                        for(var i=0;i<month.info.recommended.length;i++){ 
                              result+=month.info.recommended[i];
                              if(month.info.recommended.length==2 && i==0)  result+=" or ";
                        }
                        
                  }
                  return result;
             }

              this.getRecommendedError=function(month){
              if (month.info.plant) {
                var numString="<h4>Recommended category: </h4>"+month.info.recommended ;
                return numString;
              }
             }

             this.getMonthWarning=function(month){
             	var currentPlant=month.info.plant[0].name	
             		
             }

             this.getPlantNumber=function(blox,month,index){
             	var area=blox.area;
              
              if(month.info.plant){
             	  if (month.info.plant[index]) {
                  if(month.info.plant[index].sqm)return (area * Number(month.info.plant[index].sqm));
                }
              }
             }

             this.getPlantNumberInfo=function(month,index){
              if (month.info.plant) {

                var numString=month.info.plant[index].sqm +" per sqm";
                return numString;
              }
             }

            

             this.getCompanions=function(month){

              if(month.companionEdit1 || month.companionEdit2){  
                 
                    var companionsIDs=month.info.plant[0].companions;
                    if(!companionsIDs) companionsIDs=[];
                    var companionList=[];

                    /*for(var i=0;i<companionsIDs.length;i++){
                        var selectedPlant= grow.plants.filter(function(item) { return item.id ==companionsIDs[i];})[0];
                        selectedPlant.recommended="Recommended companions";
                        //console.log(companionsIDs[i]);
                        companionList.push(selectedPlant);
                    }*/

                    for(var i=0;i<grow.plants.length;i++){
                      var plant=grow.plants[i];
                      plant.recommended="All plants";
                      
                      for(var j=0;j<companionsIDs.length;j++){
                        if(plant.id==companionsIDs[j]){
                          plant.recommended="Recommended companions";
                          break;
                        }

                        
                      } 
                      companionList.push(plant);
                    }

                     companionList = $filter('orderBy')(companionList, 'name');

                    // add an attribute to the full list to promote the recommended



                    //console.log(companionList);
                    return companionList;
                  
                
               
               }
             }

             this.reverseOrderFilterFn = function(groups) {
              return groups.reverse();
            };

            this.hovercell=function(month){
              console.log(month);
            }


             this.hasCompanions=function(season,blox,month){

              if(month.info.plant && month.info.plant[2] && month.info.plant[2].category){
                //console.log("found 2 companions from the start")
                return false
                
              }else if(month.info.plant && month.info.plant[0] && month.info.plant[0].category){ // Figure out wether there are 2 companions at any stage during the life of this section
                  var foundCompanions=false;
                  var startIndex= blox.months.indexOf(month);
                  var endIndex=startIndex+Number(month.info.plant[0].length);
                  var seasonIndex=grow.seasons.indexOf(season);
                  var bloxIndex=season.bloxs.indexOf(blox);

                  for (var i=startIndex;i<endIndex;i++){
                    if(blox.months[i]){ // CUrrent season
                      
                      if(blox.months[i].info.plant && blox.months[i].info.plant[2] && blox.months[i].info.plant[2].category){
                        foundCompanions=true;
                        break;
                      }
                      if(blox.months[i].info.status=="end") break;
                    }
                  }

                  if(foundCompanions==true){
                    //console.log("found 2 companions later on")
                    return false;
                  }else{
                    if (month.info.status!='' && month.info.status!='end'){
                      
                      
                      return true;
                    }
                  }
                }
             }

             this.logDetails=function(season,blox,month){
              console.log("********")
              console.log(month);
              //console.log(grow.hasCompanions(season,blox,month));
             }

             this.addCompanion=function(season,month,blox,plantIndex){
                month.companionEdit1=false; 
                month.companionEdit2=false; 

                if(plantIndex==1) month.companion1start=true;
                if(plantIndex==2) month.companion2start=true;
                
                var plantLength=  month.info.plant.length-1;  
                
                var newPlant = month.info.plant[plantIndex];
                
                var startIndex= blox.months.indexOf(month)+1;
                var endIndex=startIndex+Number(newPlant.length)-1;
                
                var seasonIndex=grow.seasons.indexOf(season);
                var bloxIndex=season.bloxs.indexOf(blox); 
                var foundTheEnd=false;
                var foundAnotherPlant=false;

                grow.addSeedlings(season,month,blox,month.info.plant[plantIndex]);
                //month.info.plant[0].companions.splice(month.info.plant[0].companions.indexOf(Number(newPlant.id)),1);


                  for(var i=startIndex; i<endIndex;i++){
                    
                      
                        if(blox.months[i]){
                          // CURRENT SEASON
                          //Check for conflicts
                          if(blox.months[i].info.status=="start") {
                            blox.months[i-1].info.status="end"
                            break;
                          }


                          //Check if there is already a companion in that slot
                          if(blox.months[i].info.plant){
                            if(blox.months[i].info.plant[plantIndex] && blox.months[i].info.plant[plantIndex].category){
                              console.log("Found an existing companion "+i);
                              blox.months[i].info.plant[plantIndex+1]=blox.months[i].info.plant[plantIndex];
                              if(foundAnotherPlant==false){
                                blox.months[i].companion1start=false;
                                blox.months[i].companion2start=true;
                                foundAnotherPlant=true;
                              }
                            }
                        }

                          if(!foundTheEnd){
                            blox.months[i].info.plant[plantIndex]=newPlant;
                            
                          }else{
                            blox.months[i].info.status="continued";
                            blox.months[i].info.plant=[{},{},{}];
                            blox.months[i].info.plant[plantIndex]=newPlant;
                            if(i==endIndex-1){
                              blox.months[i].info.status="end";
                            }
                          }
                          if(blox.months[i].info.status=="end" && i<endIndex-1){
                            console.log("found the end")
                            foundTheEnd=true;
                            blox.months[i].info.status="continued";
                        
                          }
                        }else{
                          // NEXT SEASON
                          var index=i-6;
                          var newSeasonIndex=grow.seasons.indexOf(season)+1;
                          if(!grow.seasons[newSeasonIndex]) grow.addSeason();
                          var newBlox=grow.seasons[newSeasonIndex].bloxs[bloxIndex];
                         
                          //Check for conflicts

                          if(newBlox.months[index].info.status=="start") {
                            if(i>0){
                            newBlox.months[index-1].info.status="end";
                            }else{
                              blox.months[6].info.status="end";
                            }
                            break;
                          }

                          if(newBlox.months[index].info.plant && newBlox.months[index].info.plant[plantIndex]){
                              console.log("Found an existing companion "+i);
                              newBlox.months[index].info.plant[plantIndex+1]=newBlox.months[index].info.plant[plantIndex];
                              if(foundAnotherPlant==false){
                                newBlox.months[index].companion1start=false;
                                newBlox.months[index].companion2start=true;
                                foundAnotherPlant=true;
                              }
                            }

                          
                          if(!foundTheEnd){
                             newBlox.months[index].info.plant[plantIndex]=newPlant;
                           }else{
                              //console.log(newBlox.months[index]);
                               newBlox.months[index].info.status="continued";
                              newBlox.months[index].info.plant=[{},{},{}];
                              
                               newBlox.months[index].info.plant[plantIndex]=newPlant;
                              if(i==endIndex-1){
                                newBlox.months[index].info.status="end";
                              }
                           } 
                           if(newBlox.months[index].info.status=="end" && i<endIndex-1){
                            foundTheEnd=true;
                            newBlox.months[index].info.status="continued";
                        
                          }
                             
                        }
                        // Check if the main plant is till here
                           
                         

                     
                        
                      
                  }
                  // If we have found a companion in a spot we re trying to add a new one, it got moved but only until the new one ended.
                  if (foundAnotherPlant==true) {
                    if(!newBlox) {
                      grow.moveCompanions(blox,endIndex)
                    }else{
                      grow.moveCompanions(newBlox,endIndex-6)
                    }
                  }

             }


            this.moveCompanions=function(blox,index,up){
                var foundTheEnd=false;
                console.log("moving companion"+index)
                for(var i=index; i<6;i++){
                  console.log("moving:" +i);
                  if(foundTheEnd==false){
                    if(up){
                      blox.months[i].info.plant[1]=blox.months[i].info.plant[2];
                      blox.months[i].info.plant[2]={};
                    }else{
                      blox.months[i].info.plant[2]=blox.months[i].info.plant[1];
                      blox.months[i].info.plant[1]={};
                    }
                    if(blox.months[i].info.status=="end") foundTheEnd=true;
                  }else{
                    break;
                  }

                }

            }

             this.clearCompanion =function(season,month,blox,plantIndex){
                var startIndex= blox.months.indexOf(month);
                var endIndex=startIndex+Number(month.info.plant[plantIndex].length);
                var seasonIndex=grow.seasons.indexOf(season);
                var bloxIndex=season.bloxs.indexOf(blox); 
                var foundTheEnd=false;
                var setNewEnd=false;
                if(plantIndex==1) month.companion1start=false;
                if(plantIndex==2) month.companion2start=false;

                grow.removeSeedlings(season,month,blox,month.info.plant[plantIndex]);
                
                //month.info.plant[0].companions.push(month.info.plant[plantIndex].id)

                for(var i=startIndex; i<6;i++){
                    if(blox.months[i]){
                      // If current season
                        if(blox.months[i].info.status=="end") foundTheEnd=true
                        blox.months[i].info.plant[plantIndex]={};
                    }
                    
                    if ('category' in blox.months[i].info.plant[0]==false ) {
                      blox.months[i].info.status="";
                      
                      if(!setNewEnd){
                          blox.months[i-1].info.status="end";
                          setNewEnd=true;
                      }
                    }
                    if(foundTheEnd) break;
                }

                if(!foundTheEnd){
                          var newSeasonIndex=seasonIndex+1;
                          var newBlox=grow.seasons[newSeasonIndex].bloxs[bloxIndex];
                          console.log(newBlox);


                            for(var i=0;i<6;i++){
                              if(newBlox.months[i].info.status=="end") foundTheEnd=true
                              
                              newBlox.months[i].info.plant[plantIndex]={};
                              
                              if ('category' in newBlox.months[i].info.plant[0]==false ) {
                                newBlox.months[i].info.status="";
                                
                                if(!setNewEnd && newBlox.months[i-1]){
                                 newBlox.months[i-1].info.status="end";
                                 setNewEnd=true;
                               }
                              }
                              if(foundTheEnd) break;

                            }
                            //grow.setRecommended(grow.seasons[newSeasonIndex],bloxIndex);

                        }
                        // Recommendations
                        //grow.setRecommended(season,bloxIndex);

                        /* if this is slot one and there is one in two, swap it. */
                if(plantIndex==1 && month.info.plant[2] && month.info.plant[2].category){
                // First we need to find the start
                console.log("Here"+startIndex);
                  for(var i=startIndex;i<6;i++){
                    console.log("$$$ "+i);
                    if(blox.months[i].companion2start){
                      blox.months[i].companion2start=false;
                      blox.months[i].companion1start=true;
                      grow.moveCompanions(blox,i,true);
                      break;
                    }
                  }

                }

             }

             this.clearMonth=function(season,month,blox){
                        var index=blox.months.indexOf(month);  
                        
                        grow.removeSeedlings(season,month,blox,month.info.plant[0]);

                        var foundTheEnd=false;
                         var bloxIndex=season.bloxs.indexOf(blox); 
                        // Clear this season until end

                        for(var i=index;i<6;i++){
                          if(blox.months[i].info.status=="end" || blox.months[i].info.conflict) foundTheEnd=true
                          blox.months[i].info.status="";
                          blox.months[i].info.plant=[{},{},{}];
                          blox.months[i].info.conflict="";
                          
                          if(foundTheEnd) {
                            break;
                          }

                        }

                        // clear into the next season if we haven't found the end.
                        if(!foundTheEnd){
                          var newSeasonIndex=grow.seasons.indexOf(season)+1;
                          var newBlox=grow.seasons[newSeasonIndex].bloxs[bloxIndex];
                            for(var i=0;i<6;i++){
                              if(newBlox.months[i].info.status=="end" || newBlox.months[i].info.conflict) foundTheEnd=true
                              newBlox.months[i].info.status="";
                            newBlox.months[i].info.conflict="";
                              newBlox.months[i].info.plant=[{}];

                              if(foundTheEnd) {
                                
                                break;
                              }

                            }

                        }

                        

                        // Recommendations
                        grow.setRecommended(season,bloxIndex);
                        if(grow.seasons[newSeasonIndex-2]) grow.setRecommended(grow.seasons[newSeasonIndex-2],bloxIndex);
                        
      	       
                       
             }

             this.showEndPlant=function(season,month,blox,plantIndex){
              var startIndex= blox.months.indexOf(month);
              var seasonIndex=grow.seasons.indexOf(season);
              var bloxIndex=season.bloxs.indexOf(blox); 
              
                if(month.info.status=="start" || month.info.status==""){
                  return false;
                }else{
                  
                    
                      
                    // Check if the previous month was the start. We don't want to end after just one month.
                    // First check that we are not at the start of a season
                      if(startIndex>0){
                          if (blox.months[startIndex-1].info.status=="start"){
                            return false;
                          }else{
                            return true;
                          }
                      }else{
                        // Going to previous season is always a bit of a pain. Maybe I should make that a centralised function somehow
                          var previousSeason=grow.seasons[seasonIndex-1];
                          if(previousSeason){
                            
                            if(previousSeason.bloxs[bloxIndex].months[5].info.status=='start'){
                              return false;
                            }else{
                              return true;
                            }
                          }
                      

                    }
                  
                }
             }

             this.endBed=function(season,month,blox){

              var bloxIndex=season.bloxs.indexOf(blox);                              
                var length = 8;//month.info.plant[0].length;                
                var startIndex= blox.months.indexOf(month);
                var endIndex= startIndex+Number(length)-1;
                var endSeason=grow.seasons.indexOf(season);
                var bloxIndex=season.bloxs.indexOf(blox);
                var plantinfo=month.info.plant[0];
                var foundTheEnd=false;

                console.log(startIndex+" --- "+endIndex);

                for (var i = startIndex; i <= endIndex; i++) {

                    if(blox.months[i]){
                      // If current season
                      console.log(i+" **** "+ blox.months[i].info.status)
                          if(blox.months[i].info.status=="continued" || blox.months[i].info.status=="end"){
                              
                              blox.months[i].info.plant=[{}];
                              blox.months[i].info.status="";
                               console.log(i+" #### "+ blox.months[i].info.status)
                             // 
                              
                          }else{
                            foundTheEnd=true;
                            console.log("FOund the end:"+i)
                            break;
                          }
                      
                    }
                }


                // IF we go across to the next season

                if(endIndex>5 && !foundTheEnd){

                    endSeason++;
                    if(grow.seasons[endSeason]){
                      var tempBlox = grow.seasons[endSeason].bloxs[bloxIndex];
                    }

                     for (var i = 0; i <= 5; i++) {
                         if(tempBlox.months[i]){
                        
                          if(tempBlox.months[i].info.status=="continued" || tempBlox.months[i].info.status=="end"){
                            
                              tempBlox.months[i].info.plant=[{}];
                              
                                tempBlox.months[i].info.status="";                              
                                grow.setRecommended(grow.seasons[endSeason],bloxIndex);
                              
                              
                          }else{
                            break;
                          }
                        }
                          
                      }
                    }

                    // Set the previous month to be the end month
                      if(startIndex>0){ // If we're not stopping on the first month of a season
                         
                           blox.months[startIndex-1].info.status="end";

                      }else{ // If we are stopping on the first month of a season, we need to end at the end of previous season
                        
                          grow.seasons[endSeason-1].bloxs[bloxIndex].months[5].info.status="end";
                      }

                      grow.setRecommended(season,bloxIndex);
             }


            


             this.getCategory=function(month){
              var category="";
            if(month.info.plant) {
                if(month.info.plant[0].category) {
                  category= (month.info.plant[0].category);
                }else{
                  if(month.info.plant[1] && month.info.plant[1].category) {
                    category= (month.info.plant[1].category);
                  }else if(month.info.plant[2] && month.info.plant[2].category) {
                    category= (month.info.plant[2].category);
                  }
                  
                }
               }
               //console.log(category)
               return (category)
            }

             this.updateMonth=function(season,month,blox,clear){

              if(!month.info.plant.length){
                
                var arr = Object.keys(month.info.plant).map(function (key) { return month.info.plant[key]; });
                console.log(arr);
                
                month.info.plant=angular.copy(arr);
                  console.log(month.info.plant);
              }
      	       		month.plant.id=month.info.plant[0].id;
                              //console.log(month);

                              if(month.info.status=="continued") month.info.conflict="conflict";
                              
                              var bloxIndex=season.bloxs.indexOf(blox);
                              
                                    var length = month.info.plant[0].length;
                                    var foundConflict=false;
                                    
                                    var startIndex= blox.months.indexOf(month);
                                    var endIndex= startIndex+Number(length)-1;
                                    
                                    var endSeason=grow.seasons.indexOf(season);
                                    startIndex++;
                                    if(clear){
                                          month.info.status="";
                                          month.info.plant[0]={};
                                    }else{
                                          month.info.status="start";
                                          // SEEDLINGS STUFF
                                          grow.addSeedlings(season,month,blox,month.info.plant[0]);



                                    }

                                    // DEFAULT BEHAVIOUR
                                    
                                    for (var i = startIndex; i <= endIndex; i++) {
                                          if(blox.months[i]){
                                               if(!month.info.plant[0]) { month.info.plant=[]; }
                                               var endBlock=false
                                               if(i==endIndex) endBlock=true;

                                                

                                                //console.log (i+ "**" + blox.months[i].info.conflict);
                                                if(blox.months[i].info.conflic && blox.months[i].info.conflict=="conflict") {
                                                      foundConflict=true;
                                                      console.log ("found conflict before")
                                                      if(clear) blox.months[i].info.conflict="";
                                                      break;
                                                }
                                                grow.setContinued(season, bloxIndex, month.info.plant[0], i,endBlock);
                                          }

                                    }
                                   
                                    // IN CASE IT GOES ACCROSS SEASONS

                                    if(endIndex>5 && !foundConflict){
                                          endSeason++;
                                          endIndex-=6;
                                          for (var i = 0; i <= endIndex; i++) {
                                                var endBlock=false
                                                if(i==endIndex) endBlock=true;
                                                //console.log ("***" +endBlock)
                                                grow.setContinued(grow.seasons[endSeason], bloxIndex, month.info.plant[0], i,endBlock);
                                                if(blox.months[i].info && blox.months[i].info.conflic && blox.months[i].info.conflict=="conflict") {
                                                      console.log ("found conflict afterx")
                                                      break;
                                                }
                                          }

                                    }
                                    if(!clear){
                                          //grow.addJob(season,blox,month);
                                          month.edit=false;
                                    }

                               
                               grow.setRecommended(season,bloxIndex);
                               grow.setRecommended(grow.seasons[endSeason-1],bloxIndex);

                               console.log (grow.settings);
                               if(grow.settings.seenRecommended==true || grow.settings.seenRecommended==undefined){
                                  grow.settings.seenRecommended=true;
                                  grow.showAlert("<p>You can add a companion plant to this same block, whether at the same time or a few months later. Simply click on the <span class='editLink fa fa-user-plus'></span> icon on the select month. </p><p>The coloured stripe below this newly planted block indicates the recommended category for what you will plant next.</p> ");

                               }
                               
      	      // $scope.$evalAsync();		
      	       	
             }

             this.setRecommended=function(season,bloxIndex,recommended){
                  //console.log("setting recommended for season "+season.year+" - "+ season.type +"and block"+bloxIndex+" - "+recommended);

                  if(season){
                    if(!recommended) recommended="";
                    
                    for (var i = 0; i < 6; i++) {
                          var month=season.bloxs[bloxIndex].months[i];

                          if(month.info.status=="start" || month.info.status=="continued"  ||  month.info.status=="end"){

                                /* Determine the recommended category for following bloxs  */
                                if(month.info.plant[0].category=="Heavy") recommended=["Green","Roots"];
                                if(month.info.plant[0].category=="Green" || month.info.plant[0].category=="Roots") recommended=["Carbon"];
                                if(month.info.plant[0].category=="Carbon") recommended=["Heavy"] 
                          }else{
                                if(month.info.status=="") month.info.recommended=recommended; 
                          }


                    }
                    var seasonIndex=grow.seasons.indexOf(season);
                    if(seasonIndex<grow.seasons.length-1) grow.setRecommended(grow.seasons[seasonIndex+1],bloxIndex,recommended)
                }
             }

             this.getStripes=function(month){
                  
                  if(month.info.status=="" && month.info.recommended){
                        return ("stripes-"+month.info.recommended[0]);
                  }
             }

             this.getRecommendedLabel=function(month){
                  
                  if(month.info.status=="" && month.info.recommended){
                        return (month.info.recommended[0]);
                  }
             }

             this.setContinued=function(season,bloxIndex,plant,index,endBlock){
                  
                  //console.log("setting continued for season "+season.year+" and block"+bloxIndex+" - "+index);

                  if(!season) {
                        grow.addSeason();
                        season=grow.seasons[grow.seasons.length-1];
                  }

                  var month=season.bloxs[bloxIndex].months[index];
                  var previousMonth=season.bloxs[bloxIndex].months[index-1];
                  if(index<6){

                        if(plant){

                              if(month.info.status=="start" ){
                                    previousMonth.info.conflict="conflict";

                              }else{
                                if(month.info.status!="continued"){
                                    if(!endBlock){
                                      month.info.status="continued";
                                    }else{
                                      month.info.status="end";
                                    }

                                    if(!month.info.plant) { month.info.plant =[];}
                                    month.info.plant[0]=plant;
                                    month.info.continuedIndex=index;
                                  }
                                    //console.log("^^^ "+plant.length+" ^^^ "+month.info.continuedIndex);
                              }
                        }else{
                              if(!month.info.conflict){
                                  
                                    month.info.status="" ;
                                    delete (month.info.plant[0]);
                              }
                        }
                  }
             }
              /* --------- SEEDLINGS ------------  */

              this.initialiseSeedlings=function(){
                // First check whether there is an existing list for each season
                console.log("initalising seedlings");
                console.log(grow.seasons.length);
                for(var i=0; i<grow.seasons.length ; i++){
                  var season=grow.seasons[i];
                  console.log(season +" --" + i)
                    if(!season.seedlings){
                      season.seedlings=[];
                       for (var j=0;j<6;j++){
                          var seedlingMonth=[];
                          season.seedlings.push(seedlingMonth);

                       }
                       console.log(season.seedlings)
                     }
                   }
                }


              this.addSeedlings=function(season,month,blox,plant){
                 var monthIndex= blox.months.indexOf(month);

                 var bloxIndex= season.bloxs.indexOf(blox);
                 
                 var seedlingMonthIndex=monthIndex-plant.sowingDelay;
                 //IF we need to look into previous season;
                 if(seedlingMonthIndex<0){
                    seedlingMonthIndex+=6;
                    var seasonIndex=grow.seasons.indexOf(season);
                    console.log(seasonIndex);
                    if(seasonIndex==0){
                      
                      grow.addPreviousSeason();
                    }
                    var previousSeason=grow.seasons[seasonIndex-1];
                    if(previousSeason) season=previousSeason;
                 }
                   season.seedlings[seedlingMonthIndex].push({"plant":plant,"bloxIndex":bloxIndex,"blox":blox});
                   console.log(season.seedlings);
                 
              }

              this.removeSeedlings=function(season,month,blox, plant){
                var monthIndex= blox.months.indexOf(month);
                var seedlingMonthIndex=monthIndex-plant.sowingDelay;
                var bloxIndex= season.bloxs.indexOf(blox);
                //IF we need to look into previous season;
                 if(seedlingMonthIndex<0){
                    seedlingMonthIndex+=6;
                    var seasonIndex=grow.seasons.indexOf(season);
                    var previousSeason=grow.seasons[seasonIndex-1];
                    if(previousSeason) season=previousSeason;
                 }


                var seedlingMonth=season.seedlings[seedlingMonthIndex];
                var indexToDelete=0;

                
                for(var i=0; i<seedlingMonth.length; i++){

                  if (seedlingMonth[i].bloxIndex==bloxIndex && seedlingMonth[i].plant.id==plant.id) {
                    indexToDelete=i;
                    break;
                  }
                }

                seedlingMonth.splice(indexToDelete,1);

                //console.log(seedlingMonth);
                //console.log(seedlingMonth.indexOf(objectToFind));



              }

              this.listSeedlings=function(plants){
                var returnString=" ";

                if(plants.length>0){
                  for(var i=0;i<plants.length;i++){
                    var numberToPlant=0;
                    
                      numberToPlant=plants[i].blox.area * Number(plants[i].plant.sqm);
                      var sowLocation="in trays for ";
                      if(plants[i].plant.sowingDelay==0) sowLocation="directly in "
                    
                    returnString+="<p>Sow "+ numberToPlant +" "+plants[i].plant.name+" "+sowLocation+ "<strong>"+grow.seasons[0].bloxs[plants[i].bloxIndex].name+"</strong></p>";
                    
                  }
                  
                }
                
                return $sanitize(returnString);
              }

              this.listSeedlingsNumber=function(plants){
                returnString="";
                if(plants.length>0){
                var returnString="<span class='seedlingNumber'>"+plants.length +"</span>";
              }
                
                
                return $sanitize(returnString);
               //return(plants.length);
              }




              

             this.addBlox=function(season){

             	/* we add the box to all seasons */
             		
             		angular.forEach(grow.seasons, function(value,key){
             			 var newMonthArray=[];
      	       		for(var i=0;i<6;i++){
      	       			newMonthArray.push({"plant": {"id": ""},"info": {"status": ""}});
      	       		}
      	       		var newBlox={
      	       			"name":"New area",
      	       			"area":1,
      	       			
      	       			"months":newMonthArray
      	       			
             			}; 
             			grow.seasons[key].bloxs.push(newBlox); 
             		});
             }

             this.removeBlox=function(season,blox){
             		var index=grow.seasons.indexOf(season);
             		var index2=grow.seasons[index].bloxs.indexOf(blox);
                console.log("removing blox: "+index2)

             		angular.forEach(grow.seasons, function(value,key){
             			
             			grow.seasons[key].bloxs.splice(index2,1); 
             		});
            		 
             }

             this.removeBloxPrompt=function(season,blox){
              $ngConfirm({
                    theme:'modern',
                  title: 'Warning',
                  type: 'red',
                  content: "Are you sure you want to delete this area? This can't be undone",
                  scope: $scope,
                  buttons: {
                    Logout: {
                        text: "Yes, remove it!",
                        btnClass: 'btn-danger',
                        action: function(scope, button){
                            grow.removeBlox(season,blox)
                        }
                    },
                    
                    Cancel: {
                        text: "Cancel",
                        btnClass: 'btn-grey',
                        action: function(scope, button){
                            
                            return true; // prevent close;
                        }
                    },
                }
            });
             }

             this.updateBlox=function(season,blox){
             		//console.log("updating");
             		var index=grow.seasons.indexOf(season);
             		var index2=grow.seasons[index].bloxs.indexOf(blox);
             		var newName=blox.name;
             		var newArea=blox.area;
             		angular.forEach(grow.seasons, function(value,key){
             			grow.seasons[key].bloxs[index2].name=newName;
             			grow.seasons[key].bloxs[index2].area=newArea; 
             		});
             }

             this.addPreviousSeason=function(){
              console.log("adding a season at the start");
                var newSeason={};
                var firstSeason=grow.seasons[0];
                newSeason.type="Summer";
                if(firstSeason.type=="Summer") newSeason.type="Winter";
                newSeason.year=Number(firstSeason.year);
                if(firstSeason.type=="Winter") newSeason.year--;
                var currentBloxs=firstSeason.bloxs;
                newSeason.visible=true;
                newSeason.bloxs=[];

                angular.forEach(currentBloxs, function(value,key){

                  var newMonthArray=[];
                  for(var i=0;i<6;i++){
                    newMonthArray.push({"plant": {"id": ""},"info": {"status": ""}});
                  }
                  var newBlox={"name":currentBloxs[key].name, 
                    
                        "area":currentBloxs[key].area,
                        "months":newMonthArray,

                    };

                  newSeason.bloxs.push(newBlox);
                });

                newSeason.seedlings=[];
                       for (var j=0;j<6;j++){
                          var seedlingMonth=[];
                          newSeason.seedlings.push(seedlingMonth);

                       }
                
                grow.seasons.unshift(newSeason);
                $scope.$evalAsync();

             }

             this.addSeason=function(){
             		var newSeason={};
             		var previousSeason=grow.seasons[grow.seasons.length-1];
             		newSeason.type="Summer";
             		if(previousSeason.type=="Summer") newSeason.type="Winter";
             		newSeason.year=Number(previousSeason.year);
             		if(previousSeason.type=="Summer") newSeason.year++;
             		var currentBloxs=previousSeason.bloxs;
             		newSeason.visible=true;
             		newSeason.bloxs=[];
             		
             		angular.forEach(currentBloxs, function(value,key){

             			var newMonthArray=[];
             			for(var i=0;i<6;i++){
             				newMonthArray.push({"plant": {"id": ""},"info": {"status": ""}});
             			}
             			var newBlox={"name":currentBloxs[key].name, 
             				
      	                "area":currentBloxs[key].area,
      	                "months":newMonthArray,

      	            };

             			newSeason.bloxs.push(newBlox);
             		});


             		newSeason.seedlings=[];
                       for (var j=0;j<6;j++){
                          var seedlingMonth=[];
                          newSeason.seedlings.push(seedlingMonth);

                       }
             		grow.seasons.push(newSeason);

                      // Carry on the recommendations
                for(var i=0;i<newSeason.bloxs.length;i++){

                  grow.setRecommended(grow.seasons[grow.seasons.length-2],i);
                }
                $scope.$evalAsync();

             }

             

           

             this.getVisibility=function(season){
             		if (season.visible){
             			return "fa-arrow-up"
             		}else{
             			return "fa-arrow-down"
             		}
             }

             

             this.editBloxToggle=function(blox){
             		if(blox.edit){
             			blox.edit=false;
             		}else{
             			blox.edit=true;
             		}
             }

             

            
             
             this.saveData=function(logout){
             		grow.saveLabel="Saving...";


             		// Remove edit mode before saving
             		angular.forEach(grow.seasons, function(value0, key0){
      	       		angular.forEach(grow.seasons[key0].bloxs, function(value1, key1){
      	       			grow.seasons[key0].bloxs[key1].edit=false
      	         		angular.forEach(value1.months, function(value2,key2){
      	         			grow.seasons[key0].bloxs[key1].months[key2].edit=false; 
      	         		});
      	         	});
             		});

                //console.log(grow.seasons);

                //FIREBASE SAVING//
             		
              	//var data = JSON.stringify(grow.seasons,null,"    ");
                
                
                  var data={"plan":angular.toJson(grow.seasons),"settings":angular.toJson(grow.settings)};
              	//console.dir (data);
                  firebase.database().ref('plans/'+grow.uid ).set(data,function(error){
                   // Callback comes here
                   if(error){
                      console.log(error);
                   }
                   else{
                      console.log("Data successfully");
                      grow.saveLabel="Save";
                      $scope.$evalAsync();
                      if(logout) $scope.LogOut(event);
                    }

                  });
                  
                  

// LOCAL SAVING //

              	/*
      		      $http.post("/php/save.php/", data).success(function(data, status) {
      		        console.log("success: "+data);
      		        grow.saveLabel="Save";
      		    })  */
      		    
             }

             this.getSeasonTotal=function(season){
             		var result=0;
             		var index=grow.seasons.indexOf(season);
             		angular.forEach(grow.seasons[index].bloxs, function(value1, key1){
             			result+=Number(grow.seasons[index].bloxs[key1].area);
             		});	
             		return result;
             }

             this.getTotal=function(season,color,aboutwidth){
             	
                var totalSeasonArea=0//grow.getSeasonTotal(season)*6; /* Total number of sqm months */
                var percent=0;
             		var result=0;
             		var index=grow.seasons.indexOf(season);

             		angular.forEach(grow.seasons[index].bloxs, function(value1, key1){

                  angular.forEach(grow.seasons[index].bloxs[key1].months, function(value2, key2){
                    if(grow.seasons[index].bloxs[key1].months[key2].info.plant && grow.seasons[index].bloxs[key1].months[key2].info.plant[0].category){
                      totalSeasonArea+=Number(grow.seasons[index].bloxs[key1].area);
                   		if(grow.seasons[index].bloxs[key1].months[key2].info.plant[0].category==color) result+=Number(grow.seasons[index].bloxs[key1].area);
                    }
                    if(grow.seasons[index].bloxs[key1].months[key2].info.plant && grow.seasons[index].bloxs[key1].months[key2].info.plant[1] && grow.seasons[index].bloxs[key1].months[key2].info.plant[1].category){
                      totalSeasonArea+=Number(grow.seasons[index].bloxs[key1].area);
                      if(grow.seasons[index].bloxs[key1].months[key2].info.plant[1].category==color) result+=Number(grow.seasons[index].bloxs[key1].area);
                    }
                    if(grow.seasons[index].bloxs[key1].months[key2].info.plant && grow.seasons[index].bloxs[key1].months[key2].info.plant[2] && grow.seasons[index].bloxs[key1].months[key2].info.plant[2].category){
                      totalSeasonArea+=Number(grow.seasons[index].bloxs[key1].area);
                      if(grow.seasons[index].bloxs[key1].months[key2].info.plant[2].category==color) result+=Number(grow.seasons[index].bloxs[key1].area);
                    }
                  });
             		});	

                if(totalSeasonArea==0) {
                  percent=0;
                }   else{     
               		percent=result*100/totalSeasonArea;
               		percent = +percent.toFixed(0);
                }

                if (aboutwidth==true){
                  var width=85+130*percent/100;
                  return width;
                }else{
                  return (percent);
                }
             		

                        
             		
             }

             this.checkCarbonRatio=function(season){
                  if (grow.getTotal(season,"Carbon")<33) return true
             }


           this.toggleSeedlings=function(){
            if(grow.showSeedlings==true){
              grow.showSeedlings=false
            }else{
              grow.showSeedlings=true;
            }
           }

           this.getSeedlingVisibility=function(){
              if(grow.showSeedlings==false) {
                return("hiddenSeedlings");
              }else{
                return ("");
              }
           }

            



       
        
  	}]);
