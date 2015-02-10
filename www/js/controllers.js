angular.module('starter.controllers', ['starter.services'])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, $ionicHistory) {
  // Form data for the login modal
  $scope.loginData = {};
  $scope.visibleSubMenus = {
      'eventInfo' : true,
      'personal' : false,
      'socialMedia' : false
  };

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  $scope.toggleSubMenuVisibility = function(subMenuName) {
    $scope.visibleSubMenus[subMenuName] = !$scope.visibleSubMenus[subMenuName];
  };

  $scope.subMenuVisible = function(subMenuName) {
    return $scope.visibleSubMenus[subMenuName];
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function() {
      $scope.closeLogin();
    }, 1000);
  };

  $scope.toAppHome = function() {
    $ionicHistory.clearHistory();
    $ionicHistory.nextViewOptions({
      disableAnimate: false,
      disableBack: true
    });
  };

  $scope.toYoutube = function() {
    window.open('https://www.youtube.com/channel/UCqbs5sy_vxt-12SNdYGMPBA', '_system', 'location=no');
  };

  $scope.toFacebookEvent = function() {
    window.open('https://www.facebook.com/events/309686525893607/?fref=ts', '_system', 'location=no');
  };

  $scope.toFacebookPage = function() {
    window.open('https://www.facebook.com/MannheimForum?fref=ts', '_system', 'location=no');
  };

  $scope.toXing = function() {
    window.open('https://www.xing.com/communities/groups/mannheim-forum-6e17-1006016/about', '_system', 'location=no');
  };  
})

.controller('PlaylistsCtrl', function($scope) {
  $scope.playlists = [
    { title: 'Reggae', id: 1 },
    { title: 'Chill', id: 2 },
    { title: 'Dubstep', id: 3 },
    { title: 'Indie', id: 4 },
    { title: 'Rap', id: 5 },
    { title: 'Cowbell', id: 6 }
  ];
})

.controller('PlaylistCtrl', function($scope, $stateParams) {
})

.controller('SpeakersCtrl', function($scope, Persistence) {
  $scope.speakers = [];

  $scope.lastName = function(speaker) {
    return speaker.name.split(' ').slice(-1)[0];
  };

  Persistence.listSpeakers().then(function(speakers) {
    $scope.speakers = speakers;
  });
})

.controller('SpeakerCtrl', function($scope, $stateParams, Persistence, $sce) {
  $scope.eventsForSpeaker = [];
  $scope.speaker = [];

  Persistence.getSpeaker($stateParams.speakerId).then(function(speaker) {
    speaker.longDescription = $sce.trustAsHtml(speaker.longDescription);
    $scope.speaker = speaker;
  });

  Persistence.eventsForSpeaker($stateParams.speakerId)
    .then(function(events) {
      $scope.eventsForSpeaker = events;
    });
})

.controller('ProgramCtrl', function($scope, Persistence) {

    $scope.days = [];

    $scope.dates = 'day';
    $scope.startTimes = 'startTime';
    $scope.categoryColors = {};
    $scope.categoryNames = {};

    Persistence.listEvents().then(function(events) {
      $scope.updateDays(events);
    });

    $scope.isWorkshop = function(event) {
      return [Persistence.Entities.EVENT_TYPES.UNTERNEHMENSWORKSHOP, Persistence.Entities.EVENT_TYPES.VERTIEFUNGSWORKSHOP]
              .indexOf(event.eventType) > 0;
    };

    Persistence.listCategories().then(function(categories) {
      angular.forEach(categories, function(category) {
        $scope.categoryColors[category.serverId] = '#' + category.color;
        $scope.categoryNames[category.serverId] = category.name;
      });
    });

    var groupDays = function(events) {
      var days = {};
      angular.forEach(events, function(event) {
        var startTime = moment(event.startTime);
        var day = moment(startTime);
        day.startOf('day');
        if(!(day in days)) {
          days[day] = {};
        }
        if(!(startTime in days[day])) {
          days[day][startTime] = [];
        }
        days[day][startTime].push(event);

      });
      return days;
    };

    var daysToObjects = function(days) {
      var resultDays = [];
      angular.forEach(Object.keys(days), function(day) {
        var slots = [];
        angular.forEach(Object.keys(days[day]), function(timeslot) {
          slots.push({
            'startTime': moment(timeslot),
            'displayName' : moment(timeslot).format("HH:mm").concat(" Uhr"),
            'events' :  days[day][timeslot]
          });
        });
        resultDays.push({
          'day': moment(day),
          'displayName' : moment(day).format("dd, D.MMM"),
          'slots' : slots
        });
      });

      return resultDays;
    };

    $scope.updateDays = function(events) {
      var days = groupDays(events);
      days = daysToObjects(days);
      $scope.days = days.sort(function(day1, day2) {
        return day1.day > day2.day;
      });
    };

    $scope.favoriteEvent = function(event) {
      alert('Favorite: ' + event.name);
      return false;
    };

})

.controller('EventCtrl', function($scope, $stateParams, Persistence, $sce) {
    $scope.event = {};
    $scope.categoryColors = {};
    $scope.categoryNames = {};
    $scope.speakersForEvent = [];
    $scope.eventRoom = null;

    Persistence.getEvent($stateParams.eventId).then(function(event) {
      event.longDescription = $sce.trustAsHtml(event.longDescription);
      $scope.event = event;

      if(event.roomId) {
        Persistence.getRoom(event.roomId).then(function(room) {
          $scope.eventRoom = room;
        });
      }
    });

    Persistence.listCategories().then(function(categories) {
      angular.forEach(categories, function(category) {
        $scope.categoryColors[category.serverId] = '#' + category.color;
        $scope.categoryNames[category.serverId] = category.name;
      });
    });

    Persistence.listSpeakersForEvent($stateParams.eventId).then(function(speakers) {
      $scope.speakersForEvent = speakers;
    });

    $scope.isWorkshop = function(event) {
      return [Persistence.Entities.EVENT_TYPES.UNTERNEHMENSWORKSHOP, Persistence.Entities.EVENT_TYPES.VERTIEFUNGSWORKSHOP]
          .indexOf(event.eventType) > 0;
    };

    $scope.timeFormat = function(timeStampString) {
      var time = moment(timeStampString);
      return time.format("HH:mm").concat(" Uhr");
    }
})

.controller('PlannerCtrl', function($scope) {
})

.controller('NewsCtrl', function($scope, Persistence, $sce) {
    $scope.news = [];

    Persistence.listNews().then(function(news) {
      angular.forEach(news, function(newsItem) {
        newsItem.content = newsItem.content.replace(/img/, "img ng-cache");
        newsItem.content = newsItem.content.replace(/\/sites\/default\//, "https://www.mannheim-forum.org/sites/default/");
        newsItem.content = $sce.trustAsHtml(newsItem.content);
      });
      $scope.news = news;

    });

    $scope.dateFormat = function(timeStampString) {
      var time = moment(timeStampString, "X");
      return time.format("DD. MMM YYYY, HH").concat(" Uhr");
    };
})

.controller('ContactCtrl', function($scope) {
})

.controller('PartnersCtrl', function($scope, Persistence) {
  $scope.partners = [];

  $scope.partnerName = 'name';

    Persistence.listPartners().then(function(partners) {
      $scope.partners = partners;
    });
})

.controller('PartnerCtrl', function($scope, $stateParams, Persistence) {
  $scope.partner = {};
  $scope.workshopsOfPartner = [];

  Persistence.getPartner($stateParams.partnerId).then(function(partner) {
    $scope.partner = partner;
  });

  Persistence.getWorkshopsOfPartner($stateParams.partnerId).then(function(workshops) {
    $scope.workshopsOfPartner = workshops;
  })
})

.controller('MapCtrl', function($scope, Persistence) {
    $scope.rooms = [];

    Persistence.listRooms().then(function(rooms) {
      $scope.rooms = rooms;
    });

})

.controller('StarterCtrl', function($scope) {
})
;