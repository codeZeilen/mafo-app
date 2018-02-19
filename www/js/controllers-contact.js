angular.module('starter.controllers')

.controller('ContactCtrl', function($scope, $state, $ionicHistory, Persistence, ContactRequestOutbox, DataLanguage) {

  $scope.dataWasSaved = false;

  $scope.sendMessage = function(message) {
    if(this.contactForm && this.contactForm.$valid) {
      var that = this;
      Persistence.addContactRequest(angular.copy(message)).then(function() {
        $scope.dataWasSaved = true;
        ContactRequestOutbox.send();

        message.firstName = "";
        message.lastName = "";
        message.email = "";
        message.message = "";

        that.contactForm.$setPristine();
      });
    } else {
      $scope.dataWasSaved = false;
    }
  };

  var changeTemplate = function() {
    if(DataLanguage.currentLanguage() === 'en') {
      if($state.current.name !== 'app.contactEn') {
        $ionicHistory.currentView($ionicHistory.backView());
        $state.go('app.contactEn', {}, {'location' : 'replace'});
      }
    } else {
      if($state.current.name !== 'app.contact') {
        $ionicHistory.currentView($ionicHistory.backView());
        $state.go('app.contact', {}, {'location' : 'replace'});
      }
    }
  };

  $scope.$watch(DataLanguage.currentLanguage, function(oldVal, newVal) {
    if(oldVal !== newVal) {
      changeTemplate();
    }
  });
  changeTemplate();
});