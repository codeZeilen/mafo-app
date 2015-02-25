angular.module('starter.controllers', ['starter.services'])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, $ionicHistory) {
  // Form data for the login modal
  $scope.loginData = {};
  $scope.visibleSubMenus = {
      'eventInfo' : true,
      'personal' : true,
      'socialMedia' : true
  };

  $scope.toggleSubMenuVisibility = function(subMenuName) {
    $scope.visibleSubMenus[subMenuName] = !$scope.visibleSubMenus[subMenuName];
  };

  $scope.subMenuVisible = function(subMenuName) {
    return $scope.visibleSubMenus[subMenuName];
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

.controller('SpeakersCtrl', function($scope, Persistence) {
  $scope.speakers = [];

  $scope.lastName = function(speaker) {
    return speaker.name.split(' ').slice(-1)[0];
  };

  $scope.shouldBeShown = function(speaker) {
    return speaker.isShownInList == 1;
  };

  Persistence.listSpeakers().then(function(speakers) {
    $scope.speakers = speakers;
  });
})

.controller('SpeakerCtrl', function($scope, $stateParams, Persistence) {
  $scope.eventsForSpeaker = [];
  $scope.speaker = [];

  Persistence.getSpeaker($stateParams.speakerId).then(function(speaker) {
    $scope.speaker = speaker;
  });

  Persistence.eventsForSpeaker($stateParams.speakerId)
    .then(function(events) {
      $scope.eventsForSpeaker = events;
    });
})

.controller('ProgramCtrl', function($scope, $filter, Persistence, ContentUpdater, EventUtil) {

    $scope.days = [];

    $scope.dates = 'day';
    $scope.startTimes = 'startTime';
    $scope.categoryColors = {};
    $scope.categoryNames = {};
    $scope.favoriteEventIds = [];

    $scope.categoriesNotToShow = ['Vertiefungsworkshop', 'Unternehmensworkshop'];

    var processEvents = function(events) {
      $scope.updateDays(events);
    };
    $scope.$watch(function() { return ContentUpdater.eventUpdateCounter }, function(oldVal, newVal) {
      if(!(oldVal === newVal)) {
        Persistence.listEvents().then(processEvents);
        Persistence.listCategories().then(processCategories);
      }
    });

    var processCategories = function(categories) {
      angular.forEach(categories, function(category) {
        $scope.categoryColors[category.serverId] = '#' + category.color;
        $scope.categoryNames[category.serverId] = category.name;
      });
    };
    $scope.$watch(ContentUpdater.eventUpdateCounter, function(oldVal, newVal) {
      if(!(oldVal === newVal)) {
        Persistence.listEvents().then(processEvents);
        Persistence.listCategories().then(processCategories);
      }
    });

    Persistence.listEvents().then(processEvents);
    Persistence.listCategories().then(processCategories);



    $scope.updateDays = function(events) {
      var days = EventUtil.groupDays(events);
      days = EventUtil.daysToObjects(days);
      $scope.days = $filter('orderBy')(days, function(d) { return d.day });
    };

    $scope.isFavorite = function(event) {
      return $scope.favoriteEventIds.indexOf(event.serverId) > -1;
    };
    $scope.favoriteEvent = function(event) {
      var action;
      if($scope.isFavorite(event)) {
        action = Persistence.removeFavoriteEvent(event.serverId);
      } else {
        action = Persistence.addFavoriteEvent(event.serverId);
      }
      action.then(function() {
        Persistence.listFavoriteEventIds().then(function(ids) {
          $scope.favoriteEventIds = ids;
        })
      });
    };

    $scope.eventCategoryNames = {};
    $scope.eventCategoryNames[Persistence.Entities.EVENT_TYPES.UNTERNEHMENSWORKSHOP] = 'Unternehmensworkshop';
    $scope.eventCategoryNames[Persistence.Entities.EVENT_TYPES.VERTIEFUNGSWORKSHOP] = 'Vertiefungsworkshop';
    $scope.eventCategoryNames[Persistence.Entities.EVENT_TYPES.MAIN] = 'Hauptveranstaltung';
    $scope.eventCategoryNames[Persistence.Entities.EVENT_TYPES.EVENING] = 'Rahmenprogramm';

    $scope.eventCategoryName = function(event) {
      return $scope.eventCategoryNames[event.eventType];
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
    };

    $scope.dayFormat = function(timeStampString) {
      var date = moment(timeStampString);
      date.locale("de")
      return date.format("dd");
    };
})

.controller('PlannerCtrl', function($scope, Persistence, EventUtil, $filter) {
    $scope.slots = [];

    var initializeSlots = function() {
      var start = moment("09:00", "HH:mm");
      for(var i = 0; i < 56; i++) {
        var time = moment(start);
        time = time.add(moment.duration(i*15, 'minutes'));
        $scope.slots.push({
          timestamp : time,
          timeString : time.format("HH:mm")
        });
      }
    };

    Persistence.listFavoriteEvents().then(function(favoriteEvents) {
      var startDay = moment("03-05-2015");

      // Set duration of events
      angular.forEach(favoriteEvents, function(event) {
        var duration = moment(event.endTime);
        duration.subtract(moment(event.startTime));
        event['duration'] = moment.duration(duration.hours()*60 + duration.minutes(), 'minutes');
      });

      var days = [];
      for(var dayNumber = 0; dayNumber < 3; dayNumber++) {
        var dayTimestamp = moment(startDay);
        dayTimestamp.add(moment.duration(dayNumber, 'days'));
        var daySlots = [];
        for(var i = 0; i < 56; i++) {
          var time = moment(dayTimestamp);
          time.add(moment.duration(9, 'hours'));
          time.add(moment.duration(i*15, 'minutes'));

          // Filter events in between
          var events = [];
          var endTime = moment(time);
          endTime.add(moment.duration(15, 'minutes'));
          var startTime = moment(time);
          startTime.subtract(moment.duration(1, 'minutes'));
          angular.forEach(favoriteEvents, function(event) {
            if(moment(event.startTime).isBetween(startTime, endTime)) {
              var offset = moment(event.startTime);
              offset.subtract(startTime);
              event['offset'] = moment.duration(offset.hours()*60 + offset.minutes(), 'minutes');

              event['timeString'] = moment(event.startTime).format("HH:mm").concat(" - ").concat(moment(event.endTime).format("HH:mm"));
              events.push(event);
            }
          });

          daySlots.push({
            timestamp : time,
            timeString : time.format("HH:mm"),
            events: events
          });
        }
        days.push({
          day : dayTimestamp,
          slots : daySlots
        });
      };

      $scope.days = $filter('orderBy')(days, function(d) { return moment(d.day) });
    });

    Persistence.listRooms().then(function(rooms) {
      var resultRooms = {};
      angular.forEach(rooms, function(room) {
        resultRooms[room.serverId] = room;
      });
      $scope.roomsById = resultRooms;
    });

    $scope.timeFormat = function(timeStampString) {
      var time = moment(timeStampString);
      return time.format("HH:mm").concat(" Uhr");
    };

})

.controller('NewsCtrl', function($scope, $stateParams, $location, $anchorScroll, Persistence, NewsInterval) {
    $scope.news = [];

    var updateNews = function() {
      Persistence.listNews().then(function(newsItems) {
        $scope.news = newsItems;
      });
    };

    $scope.$watch(function() { return NewsInterval.newsItems }, function(oldVal, newVal, scope) {
      if(!(oldVal === newVal)) {
        updateNews(scope);
      }
    });
    updateNews();

    $scope.dateFormat = function(timeStampString) {
      var time = moment(timeStampString, "X");
      return time.format("DD. MMM YYYY, HH").concat(" Uhr");
    };

})

.controller('NewsItemCtrl', function($scope, $stateParams, Persistence) {
  $scope.newsItem = {};

  Persistence.getNewsItem($stateParams.itemId).then(function(newsItem) {
    $scope.newsItem = newsItem;
  });

  $scope.dateFormat = function(timeStampString) {
    var time = moment(timeStampString, "X");
    return time.format("DD. MMM YYYY, HH").concat(" Uhr");
  };

})

.controller('ContactCtrl', function($scope, Persistence, ContactRequestOutbox) {

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
})

.controller('PartnersCtrl', function($scope, Persistence, ContentUpdater) {
  $scope.partners = [];

  $scope.partnerName = 'name';

  var updater = function() {
    Persistence.listPartners().then(function(partners) {
      $scope.partners = partners;
    });
  };
  $scope.$watch(function() { return ContentUpdater.partnerUpdateCounter }, function(oldVal, newVal) {
    if(!(oldVal === newVal)) {
      updater();
    }
  });
  updater();

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

})

.controller('StarterCtrl', function($scope, $ionicModal, $state, Persistence, NewsInterval, ContentUpdater, $q) {

  $scope.searchConfig = {"term" : ""};
  $scope.events = [];
  $scope.speakers = [];
  $scope.partners = [];
  $scope.news = [];

  $ionicModal.fromTemplateUrl('search-modal.html', {
    scope: $scope,
    animation: 'slide-in-up',
    focusFirstInput: false
  }).then(function(modal) {
    $scope.modal = modal;
  });

  var updateNews = function() {
    Persistence.listNews().then(function(news) {
      $scope.news = news;
    });
  };

  $scope.$watch(function() { return NewsInterval.newsItems }, function(oldVal, newVal) {
    if(!(oldVal === newVal)) {
      updateNews();
    }
  });
  updateNews();

  var updateSearchItems = function() {
    $q.all([Persistence.listEvents(),
      Persistence.listPartners(),
      Persistence.listRooms(),
      Persistence.listSpeakers()]).then(function(results) {
      $scope.events = results[0];
      $scope.partners = results[1];
      $scope.speakers = results[3];
    });
  };

  $scope.$watch(function() {
    return ContentUpdater.updateCounter;
  }, function(oldVal, newVal) {
      updateSearchItems();
  });
  updateSearchItems();


  Persistence.listNews().then(function(news) {
    $scope.news = news;
  });

  $scope.gotoItem = function(newsItemId) {
    $state.go("app.newsItem", { itemId : newsItemId });
  };

  $scope.startSearch = function() {
    $scope.modal.show().then(function() {
      document.getElementById('searchModalInput').focus();
      if(device.platform == "Android") {
        cordova.plugins.Keyboard.show();
      }
    });
    return false;
  };

  $scope.stopSearch = function() {
    $scope.modal.hide().then(function() {
      cordova.plugins.Keyboard.close();
    });
  };

  $scope.exitSearch = function() {
    $scope.modal.hide().then(function() {
      cordova.plugins.Keyboard.close();
    });
  };

  /* Frankenstein code to cater for all types of items */
  $scope.itemConfigurations = {
    categoryColors : {},
    categoryNames : {}
  };

  Persistence.listCategories().then(function(categories) {
    angular.forEach(categories, function(category) {
      $scope.itemConfigurations.categoryColors[category.serverId] = '#' + category.color;
      $scope.itemConfigurations.categoryNames[category.serverId] = category.name;
    });
  });

  $scope.categoriesNotToShow = ['Vertiefungsworkshop', 'Unternehmensworkshop'];
  $scope.eventCategoryNames = {};
  $scope.eventCategoryNames[Persistence.Entities.EVENT_TYPES.UNTERNEHMENSWORKSHOP] = 'Unternehmensworkshop';
  $scope.eventCategoryNames[Persistence.Entities.EVENT_TYPES.VERTIEFUNGSWORKSHOP] = 'Vertiefungsworkshop';
  $scope.eventCategoryNames[Persistence.Entities.EVENT_TYPES.MAIN] = 'Hauptveranstaltung';
  $scope.eventCategoryNames[Persistence.Entities.EVENT_TYPES.EVENING] = 'Rahmenprogramm';

  $scope.eventCategoryName = function(event) {
    return $scope.eventCategoryNames[event.eventType];
  };

  $scope.dateFormat = function(timeStampString) {
    var time = moment(timeStampString, "X");
    return time.format("DD. MMM YYYY, HH").concat(" Uhr");
  };
})

.controller('FAQCtrl', function($scope) {
    $scope.questions = [
      {
        question: "Wo kann ich einchecken?",
        answer  : "Am Check-In - den Weg zum Check-in findest Du im Schloss ausgeschildert. Über den App-Newsticker " +
        "und die Monitore am Eingang halten wir Dich über die Öffnungszeiten des Check-Ins auf dem Laufenden."
      },
      {
        question: "Was kann mein Namenskärtchen? Und wofür dieses Bändchen? Und wenn ich es verliere?",
        answer  : "Das Namenskärtchen ist Deine Eintrittskarte zu allen Veranstaltungen. Für die" +
        "Abendveranstaltungen brauchst du das Bändchen." +
        "Bei Verlust wird weder das Namenskärtchen noch das Bändchen ersetzt! Also...Nicht verlieren ;)"
      },{
        question: "Gibt es einen Dresscode?",
        answer  : "Nein, einen offiziellen Dresscode gibt es beim Mannheim Forum nicht. Kleide Dich so, wie Du es für angemessen hältst und Du Dich wohlfühlst. Für die Workshops und Unternehmensgespräche empfehlen wir Dir natürlich so aufzutreten, wie es Dir passend erscheint."
      },{
        question: "Welche Veranstaltungen kann ich besuchen?",
        answer  : "Grundsätzlich steht all unseren Teilnehmern der Besuch von Hauptveranstaltungen sowie unserer Abendveranstaltungen offen. Auch die Verpflegung mit Essen ist inklusive." +
        "Über die Teilnahme an Workshops oder Unternehmensgesprächen wurdest Du gesondert via E-Mail informiert. Im dringenden Notfall kannst du am Info-Point nachfragen, für welche Veranstaltungen Du eine Zusage erhalten hast."
      },{
        question: "Hilfe, ich weiß nicht mehr zu welchen Veranstaltungen ich mich angemeldet habe. Was mache ich jetzt?",
        answer  : "In einem solchen Notfall kannst Du Dich am Info-Point über die Veranstaltungen informieren, für die Du eine Zusage erhalten hast."
      },{
        question: "Was mache ich, wenn ich es nicht pünktlich zu einer Veranstaltung schaffe oder eine Veranstaltung voll ist?",
        answer  : "Falls Du zu spät kommst, verpasst Du das Beste, kannst aber noch versuchen einen Platz in der Veranstaltung zu erhalten. Es kann jedoch sein, dass es keinen Platz mehr gibt. In diesem Fall wirst Du an der Tür darüber informiert und kannst Du die Veranstaltung in der Mannheim Forum Lounge live miterleben."
  },{
        question: "Muss ich meine Bestätigungsemail zu den Workshops mitbringen?",
        answer  : "Nein, weise Dich einfach zu Beginn der Veranstaltung mit Deinem Namenskärtchen aus, die Referenten sind über Dein Kommen informiert."
      },{
        question: "Kann ich persönlich mit den Rednern/Moderatoren sprechen?",
        answer  : "Ein persönliches Gespräch unter vier Augen ist vermutlich leider nicht möglich. Bei unseren Hauptveranstaltungen gibt es aber für gewöhnlich am Ende eine Fragerunde, bei der Du Deine Fragen loswerden kannst."
      },{
        question: "Gibt es Anwesenheitspflicht?",
        answer  : "Nein, wir zwingen Dich natürlich nicht, zu den einzelnen Veranstaltungen zu kommen. Wir möchten Dich allerdings bitten, zu den Workshops zu erscheinen, für die Du eine Zusage erhalten hast. Das ist den anderen Teilnehmern gegenüber nur fair, denn für manche Workshops gab es bis zu 300 Bewerber."
      },{
        question: "Wer ist mein Ansprechpartner für alles?",
        answer  : "Wir haben eine Nummer für jeden Kummer unter der Du Dich immer melden kannst: 0157 54812371."
      },{
        question: "Hilfe ich verhungere - wann und wo gibt’s was zu essen?",
        answer  : "Eigentlich den ganzen Tag und rund um die Uhr. Freitag- und Samstagmittag bieten wir Dir ein umfangreiches Buffet, dazu gibt es an beiden Tagen nachmittags Kaffee und Kuchen zwischen den Hauptveranstaltungen. Außerdem sorgen wir für kulinarische Erlebnisse bei unserem Get-Together nach der Eröffnungsveranstaltung am Donnerstag und im Bootshaus am Freitag."
      },{
        question: "Was ist das Kasino? Wie sollte ich mich vorbereiten?",
        answer  : "Am Samstag hast Du bei unserem Kasino die exklusive Möglichkeit, mit unseren Partnerunternehmen in Kontakt zu treten. Von zehn bis 14 Uhr kannst  Du Dich in der Aula an den Ständen der Unternehmen über Karrieremöglichkeiten oder das Unternehmen allgemein zu informieren." +
        "Zur Vorbereitung kannst Du Dir <a href='#/app/partners'>hier</a> einmal unsere Partnerunternehmen ansehen."
      },{
        question: "Wie erfahre ich von möglichen Terminänderungen?",
        answer  : "Über unseren App-Newsticker oder am Info-Point erfährst Du alle Änderungen und wichtigen Ereignisse."
      }
    ];
  })
;