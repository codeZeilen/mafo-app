angular.module('starter.controllers')

.controller('SpeakerCtrl', function($scope, $stateParams, Persistence, DataLanguage) {
  $scope.eventsForSpeaker = [];
  $scope.speaker = [];

  var updateSpeaker = function() {
    Persistence.eventsForSpeaker($stateParams.speakerId)
        .then(function(events) {
          $scope.eventsForSpeaker = events;
        });
    Persistence.getSpeaker($stateParams.speakerId).then(function(speaker) {
      $scope.speaker = speaker;
    });
  };

  updateSpeaker();
  $scope.$watch(DataLanguage.currentLanguage, function(oldVal, newVal) {
    if(oldVal != newVal) {
      updateSpeaker();
    }
  })
});