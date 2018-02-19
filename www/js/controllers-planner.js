angular.module('starter.controllers')

.controller('PlannerCtrl', function($scope, DataLanguage, $state, $ionicHistory, Persistence, PlannerContent) {
  $scope.slots = [];
  var daysToDate = {
    'Donnerstag' : moment("03-16-2017", "MM-DD-YYYY"),
    'Freitag' : moment("03-17-2017", "MM-DD-YYYY"),
    'Samstag' : moment("03-18-2017", "MM-DD-YYYY")
  };
  $scope.days = [daysToDate.Donnerstag, daysToDate.Freitag, daysToDate.Samstag];


  $scope.roomsById = {};
  Persistence.listRooms().then(function(rooms) {
    var resultRooms = {};
    angular.forEach(rooms, function(room) {
      resultRooms[room.serverId] = room;
    });
    $scope.roomsById = resultRooms;
  });

  $scope.askForTime = function(eventModel, timeAttribute) {
    datePicker.show({
      time : eventModel[timeAttribute] || moment(),
      mode : 'time'
    }, function(enteredTime) {
      eventModel[timeAttribute] = enteredTime;
    });
  };

  $scope.range = function(min, max, step){
    step = step || 1;
    var input = [];
    for (var i = min; i <= max; i += step) input.push(i);
    return input;
  };

  var initialEvent = {
    startTimeHours : 12,
    endTimeHours : 13,
    startTimeMinutes : 0,
    endTimeMinutes : 0
  };
  $scope.userEvent = angular.copy(initialEvent);
  $scope.storeEvent = function(aUserEvent) {
    $scope.dataWasSaved = false;
    $scope.incompleteEvent = (
        (!angular.isDefined(aUserEvent.dayIndex))
        || (!angular.isDefined(aUserEvent.startTimeHours))
        || (!angular.isDefined(aUserEvent.startTimeMinutes))
        || (!angular.isDefined(aUserEvent.endTimeHours))
        || (!angular.isDefined(aUserEvent.endTimeMinutes)));
    if($scope.incompleteEvent) {
      return;
    }

    var start = moment(daysToDate[aUserEvent.dayIndex]);
    start.add(moment.duration(60*aUserEvent.startTimeHours + aUserEvent.startTimeMinutes, 'minutes'));

    var end = moment(daysToDate[aUserEvent.dayIndex]);
    end.add(moment.duration(60*aUserEvent.endTimeHours + aUserEvent.endTimeMinutes, 'minutes'));
    var eventData = {
      name : aUserEvent.name,
      location : aUserEvent.location,
      startTime : start,
      endTime : end
    };

    PlannerContent.saveUserEvent(eventData);
    $scope.dataWasSaved = true;
    $scope.userEvent = angular.copy(initialEvent);
  };

  $scope.$watch(DataLanguage.currentLanguage, function(newVal, oldVal) {
    if(!(oldVal === newVal)) {
      if(newVal === 'en') {
        $ionicHistory.clearHistory();
        $ionicHistory.nextViewOptions({
          disableAnimate: false,
          disableBack: true
        });
        $state.go('app.starter');
      }
    }
  });

})

.controller('PlannerTabCtrl', function($scope, $state, $ionicActionSheet, $ionicLoading, MafoTimeFormatter, TopicCategoryService, PlannerContent) {

  $scope.showActions = function(event) {
    var buttons = [];
    var buttonActions = [];
    if(angular.isDefined(event.serverId)) {
      buttons.push({text: 'Details'});
      buttonActions.push(function() {
        $state.go('app.event', {eventId : event.serverId});
        return true;
      });
    };
    if(event.roomId > 0 && $scope.roomsById[event.roomId].mapImagePath !== "") {
      buttons.push({text: 'Raum auf Karte zeigen'});
      buttonActions.push(function() {
        $state.go('app.room', {roomId : event.roomId});
        return true;
      })
    };

    $ionicActionSheet.show({
      buttons: buttons,
      destructiveText: 'Löschen',
      titleText: 'Event Aktionen',
      cancelText: 'Abbrechen',
      destructiveButtonClicked: function() {
        if(angular.isDefined(event.serverId)) {
          PlannerContent.removeFavoriteEvent(event);
        } else {
          PlannerContent.removeUserEvent(event);
        }
        return true;
      },
      buttonClicked: function(index) {
        return buttonActions[index]();
      }
    });
  };

  $scope.topicCategoryName = function(event) {
    return TopicCategoryService.categoryNameFromId(event.categoryId);
  };

  $scope.timeFormat = function(timeStampString) {
    return MafoTimeFormatter.formatTime(timeStampString).concat(" Uhr");
  };

  $scope.tickSpan = function(event) {
    var duration;
    if(angular.isDefined(event.durationInMinutes)) {
      duration = moment.duration(event.durationInMinutes, 'minutes');
    } else {
      var start = moment(event.startTime);
      var end = moment(event.endTime);
      end.subtract(start);duration = moment.duration(60 * end.hours() + end.minutes(), 'minutes');
    }
    return duration.asMinutes() / 15;
  };

  $scope.slots = [];
  var slotsUpdater = function() {
    $scope.slots = PlannerContent.slotsForDay($scope.day);
  };
  $scope.$watchCollection(PlannerContent.getAllEvents, slotsUpdater);
  slotsUpdater();
});