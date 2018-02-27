angular.module('starter.controllers')

.controller('ProgramCtrl', function($scope, $filter, Persistence, $ionicTabsDelegate, $state, $ionicHistory,
                                    DataLanguage, ContentUpdater, EventUtil, TopicCategoryService, PlannerContent) {

  $scope.days = [];
  $scope.dates = 'day';
  $scope.startTimes = 'startTime';
  $scope.categoriesNotToShow = Persistence.Entities.EVENT_TYPES_TO_HIDE;

  var updateShowCompleteProgram = function() {
    $scope.showCompleteProgram = DataLanguage.currentLanguage() === 'de';
    if($scope.showCompleteProgram) {
      if($state.current.name !== 'app.program') {
        $ionicHistory.currentView($ionicHistory.backView());
        $state.go('app.program', {}, {'location' : 'replace'});
      }
    } else {
      if($state.current.name !== 'app.programEn') {
        $ionicHistory.currentView($ionicHistory.backView());
        $state.go('app.programEn', {}, {'location' : 'replace'});
      }
    }
  };
  updateShowCompleteProgram();

  var processEvents = function(events) {
    $scope.updateDays(events);
  };
  var updateEvents = function() {
    Persistence.listEvents().then(processEvents);
  };
  updateEvents();
  $scope.$watch(function() { return ContentUpdater.eventUpdateCounter }, function(oldVal, newVal) {
    if(!(oldVal === newVal)) {
      updateEvents();
    }
  });
  $scope.$watch(ContentUpdater.eventUpdateCounter, function(oldVal, newVal) {
    if(!(oldVal === newVal)) {
      updateEvents();
    }
  });
  $scope.$watch(DataLanguage.currentLanguage, function(oldVal, newVal) {
    if(!(oldVal === newVal)) {
      updateShowCompleteProgram();
      updateEvents();
    }
  });

  $scope.topicCategoryColor = function(event) {
    return TopicCategoryService.categoryColorFromId(event.categoryId);
  };
  $scope.topicCategoryName = function(event) {
    return TopicCategoryService.categoryNameFromId(event.categoryId, DataLanguage.currentLanguage());
  };

  $scope.updateDays = function(events) {
    var days = EventUtil.groupDays(events);
    days = EventUtil.daysToObjects(days);
    days = $filter('orderBy')(days, function(d) { return d.day });
    if($scope.showCompleteProgram) {
      $scope.thursdaySlots = days[0];
      $scope.fridaySlots = days[1];
      $scope.saturdaySlots = days[2];
    } else {
      $scope.saturdaySlots = days[0];
    }
  };

  $scope.isFavoriteEvent = function(event) {
    return PlannerContent.isFavoriteEvent(event);
  };
  $scope.favoriteEvent = function(event) {
    if(PlannerContent.isFavoriteEvent(event)) {
      PlannerContent.removeFavoriteEvent(event);
    } else {
      PlannerContent.favoriteEvent(event);
    }
  };

  $scope.loadICS = function() {
    window.open('https://anmeldung.mannheim-forum.org/media/schedule/mafo.ics', '_system', 'location=no');
  };

  $scope.eventCategoryNames = Persistence.Entities.EVENT_TYPES_LABEL_MAPPING;


  $scope.eventCategoryName = function(event) {
    return $scope.eventCategoryNames[event.eventType];
  };

})

.controller('EventCtrl', function($scope, $stateParams, DataLanguage, Persistence, $sce, TopicCategoryService, MafoTimeFormatter) {
  $scope.event = {};
  $scope.speakersForEvent = [];
  $scope.eventRoom = null;

  var updateEvent = function() {
    Persistence.getEvent($stateParams.eventId).then(function (event) {
      $scope.event = event;

      if (event.roomId) {
        Persistence.getRoom(event.roomId).then(function (room) {
          $scope.eventRoom = room;
        });
      }
    });
  };
  updateEvent();

  $scope.$watch(DataLanguage.currentLanguage, function(oldVal, newVal) {
    if(!(oldVal === newVal)) {
      updateEvent();
    }
  });

  $scope.topicCategoryColor = function(event) {
    return TopicCategoryService.categoryColorFromId(event.categoryId);
  };

  $scope.topicCategoryName = function(event) {
    return TopicCategoryService.categoryNameFromId(event.categoryId);
  };

  Persistence.listSpeakersForEvent($stateParams.eventId).then(function(speakers) {
    $scope.speakersForEvent = speakers;
  });

  $scope.isWorkshop = function(event) {
    return Persistence.Entities.EVENT_TYPES_WORKSHOPS
        .indexOf(event.eventType) > 0;
  };

  $scope.timeFormat = function(timeStampString) {
    return MafoTimeFormatter.formatTime(timeStampString).concat(" Uhr");
  };

  $scope.dayFormat = function(timeStampString) {
    var date = moment(timeStampString);
    date.locale("de");
    return date.format("dd");
  };
});