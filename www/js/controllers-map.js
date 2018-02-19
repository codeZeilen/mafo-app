angular.module('starter.controllers')

.controller('MapCtrl', function($scope, $state, Persistence) {
$scope.rooms = [];

  Persistence.listRooms().then(function(rooms) {
    $scope.rooms = rooms;
  });

})

.controller('RoomCtrl', function($scope, $stateParams, Persistence) {

  $scope.room = {};

  $scope.specialRooms = {
    'og' : {'serverId' : 'og', 'mapImagePath' : 'Lageplan_OG_grau.jpg'},
    'eg' : {'serverId' : 'eg', 'mapImagePath' : 'Lageplan_EG_grau.jpg'}
  };

  $scope.isSpecialRoom = function(roomId) {
    return Object.keys($scope.specialRooms).indexOf(roomId) > -1;
  };

  if(! $scope.isSpecialRoom($stateParams.roomId)) {
    Persistence.getRoom($stateParams.roomId).then(function(room) {
      $scope.room = room;
    });
  } else {
    $scope.room = $scope.specialRooms[$stateParams.roomId];
  }

});