'use strict';
 
angular.module('growApp.resetpassword', ['ngRoute','firebase'])
 
// Declared route 
.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/resetpassword', {
        templateUrl: '/app/resetpassword/resetpassword.html',
        controller: 'passCtrl'
    });
}])
 
// Home controller
.controller('passCtrl', ['$scope', '$firebaseAuth','$location', function($scope, $firebaseAuth,$location) {
    
    
    $scope.loading=false;
    $scope.emailsent=false;
    $scope.founderrors=false;

   


    $scope.resetPassword = function(e) {

      console.log("Attempting to send email")

      var email = $scope.user.email;
        firebase.auth().sendPasswordResetEmail(email).catch(function(error) {
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          console.log("***");
          console.log(errorMessage);
          if(errorMessage){
              $scope.regError = true;
              $scope.regErrorMessage = error.message;
              console.log("--"+error.message);
              $scope.$apply();
              $scope.founderrors=true;
          }

          // ...
        });
        if($scope.founderrors==false){
           console.log("no problem");
              $scope.emailsent=true;
        }
       
      }

   

}]);