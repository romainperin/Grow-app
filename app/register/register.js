'use strict';
 
angular.module('growApp.register', ['ngRoute'])
 
// Declared route 
.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/register', {
        templateUrl: '/app/register/register.html',
        controller: 'RegisterCtrl'
    });
}])
 
// Register controller
.controller('RegisterCtrl', ['$scope','$location','$firebaseAuth', function($scope,$location,$firebaseAuth) {
   	
   		
       
      $scope.signUp = function() {
      		var email = $scope.user.email;
    		var password = $scope.user.password;


    		console.log($scope.regForm.$invalid);

		    if (!$scope.regForm.$invalid) {
		        console.log('Valid form submission');
		        firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
				  // Handle Errors here.
				  var errorCode = error.code;
				  var errorMessage = error.message;
				  console.log(errorMessage);
				  if(errorMessage){

				  	$scope.regError = true;
                    $scope.regErrorMessage = error.message;
                    console.log("--"+$scope.regError);
                    $scope.$apply();
                   }
				  // ...
				});
		    }



		};
       
    
}]);