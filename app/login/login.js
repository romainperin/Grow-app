'use strict';
 
angular.module('growApp.login', ['ngRoute','firebase'])
 
// Declared route 
.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/login', {
        templateUrl: '/app/login/login.html',
        controller: 'loginCtrl'
    });
    
}])
 
// Home controller
.controller('loginCtrl', ['$scope', '$firebaseAuth','$location', function($scope, $firebaseAuth,$location) {
   	
   	
   	$scope.loading=false;

      firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
          console.log("User is signed in."); 
          var uid = user.uid;
          $scope.loading=true;
          $location.path('/home');
          $scope.$apply()
        } else {
          console.log("No user is signed in.");
          $location.path('/login');
        }
      });


    $scope.SignIn = function(e) {

    	var username = $scope.user.email;
    	var password = $scope.user.password;
    	

	firebase.auth().signInWithEmailAndPassword(username, password).catch(function(error) {
	  // Handle Errors here.
	  var errorCode = error.code;
	  var errorMessage = error.message;
	  if(errorMessage){

				  	$scope.regError = true;
                    $scope.regErrorMessage = error.message;
                    console.log("--"+$scope.regError);
                    $scope.$apply();
                   }

	  // ...
	});
}

	 $scope.LogOut = function(e) {

   

		firebase.auth().signOut().then(function() {
	  // Sign-out successful.
			}).catch(function(error) {
			  // An error happened.
			});

		    
	}

}]);