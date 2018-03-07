$(window).scroll(function(){
       $('#monthsColumn').css({
        'left': $(this).scrollLeft()  
      });
       $('#header').css({
        'left': $(this).scrollLeft()  
      });
});


          var config = {
          apiKey: "AIzaSyDPbE-l_ijRlsd4WHUeC4bALFuqQpXwOq4",
          authDomain: "grow-82e3f.firebaseapp.com",
          databaseURL: "https://grow-82e3f.firebaseio.com",
          projectId: "grow-82e3f",
          storageBucket: "grow-82e3f.appspot.com",
          messagingSenderId: "1076190863756"
        };


        

       firebase.initializeApp(config);


       


     

 



      var app=angular.module('growApp', ['ngRoute','firebase','growApp.login','growApp.home','growApp.register','growApp.resetpassword']).
      config(['$routeProvider', function($routeProvider) {
          // Set defualt view of our app to home


         
          $routeProvider.otherwise({
              redirectTo: '/login'
          });
       

       
    
    
    
}]);




      