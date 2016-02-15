angular.module('starter.controllers', ['starter.services'])

.controller('AppCtrl', function($scope, $ionicModal, $timeout, $ionicHistory, DataLanguage, DataLanguageSetting) {
  // Form data for the login modal
  $scope.loginData = {};
  $scope.visibleSubMenus = {
      'eventInfo' : true,
      'personal' : true,
      'socialMedia' : true,
      'language' : false,
  };
  $scope.visibleMenuItemsPerLanguage = {
    'en' :
      ['news', 'contact', 'program', 'speakers', 'map', 'faq', 'info', 'internationalFacebookEvent'],
    'de' :
      ['planer', 'news', 'contact', 'program', 'speakers', 'partners', 'map', 'faq', 'info']
  };

  $scope.toggleSubMenuVisibility = function(subMenuName) {
    $scope.visibleSubMenus[subMenuName] = !$scope.visibleSubMenus[subMenuName];
  };

  $scope.subMenuVisible = function(subMenuName) {
    return $scope.visibleSubMenus[subMenuName];
  };

  $scope.menuItemVisible = function(menuItemIdentifier) {
    return $scope.visibleMenuItemsPerLanguage[$scope.selectedLanguage].indexOf(menuItemIdentifier) > -1;
  };

  $scope.toAppHome = function() {
    $ionicHistory.clearHistory();
    $ionicHistory.nextViewOptions({
      disableAnimate: false,
      disableBack: true
    });
  };


  $scope.selectedLanguage = DataLanguage.currentLanguage();
  $scope.$watch(DataLanguage.currentLanguage, function(oldVal, newVal) {
    if(oldVal != newVal) {
      $scope.selectedLanguage = DataLanguage.currentLanguage();
    }
  });

  $scope.setLanguageToEnglish = function() {
    DataLanguageSetting.setLanguageTo('en');
    $scope.toggleSubMenuVisibility('language');
  };

  $scope.setLanguageToGerman = function() {
    DataLanguageSetting.setLanguageTo('de');
    $scope.toggleSubMenuVisibility('language');
  };

  $scope.toYoutube = function() {
    window.open('https://www.youtube.com/user/MannheimForum', '_system', 'location=no');
  };

  $scope.toFacebookEvent = function() {
    window.open('https://www.facebook.com/events/1545289825790215/', '_system', 'location=no');
  };

  $scope.toInternationalFacebookEvent = function() {
    window.open('https://www.facebook.com/events/487062954814467/', '_system', 'location=no');
  };

  $scope.toFacebookPage = function() {
    window.open('https://www.facebook.com/MannheimForum?fref=ts', '_system', 'location=no');
  };

  $scope.toInstagram = function() {
    window.open('https://www.instagram.com/mannheimforum/', '_system', 'location=no');
  };
})

.controller('SpeakersCtrl', function($scope, Persistence, DataLanguage) {
  $scope.speakers = [];

  $scope.lastName = function(speaker) {
    return speaker.name.split(' ').slice(-1)[0];
  };

  $scope.shouldBeShown = function(speaker) {
    return speaker.isShownInList == 1;
  };

  var updateSpeakers = function() {
    Persistence.listSpeakers().then(function (speakers) {
      $scope.speakers = speakers;
    });
  };

  updateSpeakers();
  $scope.$watch(DataLanguage.currentLanguage, function(oldVal, newVal) {
    if(oldVal != newVal) {
      updateSpeakers();
    }
  })
})

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
})

.controller('ProgramCtrl', function($scope, $filter, Persistence, $ionicTabsDelegate, $state, $ionicHistory,
                                    DataLanguage, ContentUpdater, EventUtil, TopicCategoryService, PlannerContent) {

    $scope.days = [];

    $scope.dates = 'day';
    $scope.startTimes = 'startTime';

    $scope.categoriesNotToShow = ['Vertiefungsworkshop', 'Unternehmensworkshop'];
    var updateShowCompleteProgram = function() {
      $scope.showCompleteProgram = DataLanguage.currentLanguage() == 'de';
      if($scope.showCompleteProgram) {
        if($state.current.name != 'app.program') {
          $ionicHistory.currentView($ionicHistory.backView());
          $state.go('app.program', {}, {'location' : 'replace'});
        }
      } else {
        if($state.current.name != 'app.programEn') {
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

    $scope.eventCategoryNames = {};
    $scope.eventCategoryNames[Persistence.Entities.EVENT_TYPES.UNTERNEHMENSWORKSHOP] = 'Unternehmensworkshop';
    $scope.eventCategoryNames[Persistence.Entities.EVENT_TYPES.VERTIEFUNGSWORKSHOP] = 'Workshop';
    $scope.eventCategoryNames[Persistence.Entities.EVENT_TYPES.MAIN] = 'Hauptveranstaltung';
    $scope.eventCategoryNames[Persistence.Entities.EVENT_TYPES.EVENING] = 'Rahmenprogramm';

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
      return [Persistence.Entities.EVENT_TYPES.UNTERNEHMENSWORKSHOP, Persistence.Entities.EVENT_TYPES.VERTIEFUNGSWORKSHOP]
          .indexOf(event.eventType) > 0;
    };

    $scope.timeFormat = function(timeStampString) {
      return MafoTimeFormatter.formatTime(timeStampString).concat(" Uhr");
    };

    $scope.dayFormat = function(timeStampString) {
      var date = moment(timeStampString);
      date.locale("de")
      return date.format("dd");
    };
})

.controller('PlannerCtrl', function($scope, Persistence, PlannerContent) {
    $scope.slots = [];
    var daysToDate = {
      'Donnerstag' : moment("03-10-2016", "MM-DD-YYYY"),
      'Freitag' : moment("03-11-2016", "MM-DD-YYYY"),
      'Samstag' : moment("03-12-2016", "MM-DD-YYYY")
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
      if(event.roomId > 0 && $scope.roomsById[event.roomId].mapImagePath != "") {
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
})

.controller('NewsCtrl', function($scope, $stateParams, $location, $anchorScroll, Persistence, MafoTimeFormatter, NewsInterval) {
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
      return MafoTimeFormatter.formatNewsDate(timeStampString).concat(" Uhr");
    };

})

.controller('NewsItemCtrl', function($scope, $stateParams, Persistence, MafoTimeFormatter) {
  $scope.newsItem = {};

  Persistence.getNewsItem($stateParams.itemId).then(function(newsItem) {
    $scope.newsItem = newsItem;
  });

  $scope.dateFormat = function(timeStampString) {
    return MafoTimeFormatter.formatNewsDate(timeStampString).concat(" Uhr");
  };

})

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
    if(DataLanguage.currentLanguage() == 'en') {
      if($state.current.name != 'app.contactEn') {
        $ionicHistory.currentView($ionicHistory.backView());
        $state.go('app.contactEn', {}, {'location' : 'replace'});
      }
    } else {
      if($state.current.name != 'app.contact') {
        $ionicHistory.currentView($ionicHistory.backView());
        $state.go('app.contact', {}, {'location' : 'replace'});
      }
    }
  };

  $scope.$watch(DataLanguage.currentLanguage, function(oldVal, newVal) {
    if(oldVal != newVal) {
      changeTemplate();
    }
  });
  changeTemplate();
})

.controller('PartnersCtrl', function($scope, $filter, Persistence, ContentUpdater, PartnerStatus) {
  $scope.partners = [];

  $scope.partnerName = 'name';

  var updater = function() {
    Persistence.listPartners().then(function(partners) {
      $scope.premiumPartners = $filter('filter')(partners, {'partnerStatus' : 'premium'});
      $scope.workshopPartners = $filter('filter')(partners, {'partnerStatus' : 'workshop'});
      $scope.flagshipPartners = $filter('filter')(partners, {'partnerStatus' : 'flagship'});
      $scope.longTermPartners = $filter('filter')(partners, {'partnerStatus' : 'long_term'});
      $scope.circleOfFriendsPartners = $filter('filter')(partners, {'partnerStatus' : 'friends'});
      $scope.startupPartners = $filter('filter')(partners, {'partnerStatus' : 'startup'});
      $scope.supplyPartners = $filter('filter')(partners, {'partnerStatus' : 'supply'});

      $scope.otherPartners = $filter('filter')(partners, {'partnerStatus' : 'none'});
    });
  };
  $scope.$watch(function() { return ContentUpdater.partnerUpdateCounter }, function(oldVal, newVal) {
    if(!(oldVal === newVal)) {
      updater();
    }
  });
  updater();

  $scope.partnerLabels = PartnerStatus.statusLabels;

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

.controller('StarterCtrl', function($scope, $ionicModal, $state, Persistence, DataLanguage, NewsInterval, ContentUpdater, MafoTimeFormatter, PlannerContent, $q) {

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

  var convertEntityToData = function(entities) {
    return entities.map(function(e) {
      var d = e._data;
      d['_type'] = e['_type'];
      return d;
    })
  };
  var filterSpeakersToShow = function(speakers) {
    return $filter('filter')(speakers, {isShownInList : 1});
  };
  var updateSearchItems = function() {
    if(DataLanguage.currentLanguage() == 'en') {
      updateEnglishSearchItems();
    } else {
      updateGermanSearchItems();
    }
  };
  var updateEnglishSearchItems = function() {
    $q.all([Persistence.listEvents(),
      Persistence.listSpeakers(),
      Persistence.listRooms()]).then(function(results) {
        $scope.events = convertEntityToData(results[0]);
        $scope.speakers = filterSpeakersToShow(convertEntityToData(results[1]));
        $scope.partners = [];
    });
  };
  var updateGermanSearchItems = function() {
    $q.all([Persistence.listEvents(),
      Persistence.listPartners(),
      Persistence.listRooms(),
      Persistence.listSpeakers()]).then(function(results) {
      $scope.events = convertEntityToData(results[0]);
      $scope.partners = convertEntityToData(results[1]);
      $scope.speakers = filterSpeakersToShow(convertEntityToData(results[3]));
    });
  };

  $scope.$watch(DataLanguage.currentLanguage, function(oldVal, newVal) {
    if(oldVal != newVal) {
      updateSearchItems();
    }
  });
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

  $scope.compareMaFoObject = function(actual, expected) {
    if(typeof actual === 'string') {
      return actual.search(new RegExp(expected, "i")) > -1;
    }
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
   return MafoTimeFormatter.formatNewsDate(timeStampString).concat(" Uhr");
  };
})

.controller('EventInfoCtrl', function($scope, DataLanguage, $state, $ionicHistory) {

  var changeTemplate = function() {
    if(DataLanguage.currentLanguage() == 'en') {
      if($state.current.name != 'app.infoEn') {
        $ionicHistory.currentView($ionicHistory.backView());
        $state.go('app.infoEn', {}, {'location' : 'replace'});
      }
    } else {
      if($state.current.name != 'app.info') {
        $ionicHistory.currentView($ionicHistory.backView());
        $state.go('app.info', {}, {'location' : 'replace'});
      }
    }
  };

  $scope.$watch(DataLanguage.currentLanguage, function(oldVal, newVal) {
    if(oldVal != newVal) {
      changeTemplate();
    }
  });
  changeTemplate();
})

.controller('FAQCtrl', function($scope, DataLanguage) {
    $scope.questions_de = [
      {
        question: "Wo kann ich einchecken?",
        answer : "Am Check-In in O 048 - den Weg zum Check-in findest Du im Schloss ausgeschildert. Die Öffnungszeiten sind am Donnerstag von 16 – 20 Uhr und am Freitag von 07:30 bis 11 Uhr."
      },
      {
        question: "Was kann mein Namenskärtchen? Und wofür dieses Bändchen? Und wenn ich es verliere?",
        answer : "Das Namenskärtchen ist Deine Eintrittskarte zu allen Veranstaltungen sowie zum Dinner Event im Boothaus am Freitagabend. Das Bändchen" +
        "ist deine Eintrittskarte zur Mannheim Forum Night im Tiffany Club am Samstagabend." +
        "Bei Verlust wird weder das Namenskärtchen noch das Bändchen ersetzt! Also beides am Besten nicht verlieren ;)"
      },{
        question: "Gibt es einen Dresscode?",
        answer : "Wir verzichten auf eine formale Kleiderordnung, jedoch empfehlen wir um den Charakter der Veranstaltung zu unterstützen seriöse Kleidung während aller Veranstaltungen, orientiert am sogenannten „Business Casual“."
      },{
        question: "Welche Veranstaltungen kann ich besuchen?",
        answer : "Grundsätzlich steht all unseren Teilnehmern der Besuch von Hauptveranstaltungen sowie unserer Abendveranstaltungen offen. Auch die Verpflegung mit Essen ist inklusive." +
        "Über die Teilnahme an Workshops oder Unternehmensgesprächen wurdest Du gesondert via E-Mail informiert. Im dringenden Notfall kannst du am Info-Point erfragen, für welche Veranstaltungen Du eine Zusage erhalten hast."
      },{
        question: "Ich weiß nicht mehr zu welchen Veranstaltungen ich mich angemeldet habe. Was mache ich jetzt?",
        answer : "In einem solchen Notfall kannst Du Dich am Info-Point über die Veranstaltungen informieren, für die Du eine Zusage erhalten hast."
      },{
        question: "Was mache ich, wenn ich es nicht pünktlich zu einer Veranstaltung schaffe oder eine Veranstaltung voll ist?",
        answer : "Falls Du zu spät kommst, verpasst Du das Beste, kannst aber noch versuchen einen Platz in der Veranstaltung zu erhalten. Es kann jedoch sein, dass es keinen Platz mehr gibt. In diesem Fall wirst Du an der Tür darüber informiert und kannst die Veranstaltung ggf. in der Mannheim Forum Lounge live miterleben."
      },{
        question: "Muss ich meine Bestätigungsemail zum Check-in mitbringen?",
        answer : "Nein, stelle Dich im Check-in Raum einfach in der richtigen Schlange an (nach Nachnamen sortiert), dann werden wir Dich nach Deinem Namen fragen und stichprobenartig auch Ausweise kontrollieren, um sicher zu stellen, dass nur der Ticketinhaber sein Namenskärtchen bekommt."
      },{
        question: "Muss ich meine Bestätigungsemail zu den Workshops mitbringen?",
        answer : "Nein, weise Dich einfach zu Beginn der Veranstaltung mit Deinem Namenskärtchen aus, die Referenten sind über Dein Kommen informiert."
      },{
        question: "Kann ich persönlich mit den Rednern/Moderatoren sprechen?",
        answer : "Ein persönliches Gespräch unter vier Augen ist vermutlich leider nicht möglich. Bei unseren Hauptveranstaltungen gibt es aber für gewöhnlich am Ende eine Fragerunde, bei der Du Deine Fragen loswerden kannst."
      },{
        question: "Gibt es Anwesenheitspflicht?",
        answer : "Nein, wir zwingen Dich natürlich nicht, zu den einzelnen Veranstaltungen zu kommen. Wir möchten Dich allerdings bitten, zu den Workshops zu erscheinen, für die Du uns auf die Zusage eine positive Rückmeldung gegeben hast. Das ist den anderen Teilnehmern gegenüber nur fair, denn für manche Workshops gab es bis zu 300 Bewerber."
      },{
        question: "Wer ist mein Ansprechpartner für alles?",
        answer : "Wir haben eine Nummer für jeden Kummer unter der Du Dich immer melden kannst: 0157 54812371."
      },{
        question: "Hunger - wann und wo gibt es was zu essen?",
        answer : "Freitag- und Samstagmittag bieten wir Dir ein umfangreiches Buffet, dazu gibt es an beiden Tagen nachmittags Kaffee und Kuchen zwischen den Hauptveranstaltungen. Außerdem sorgen wir für kulinarische Erlebnisse bei unserem Get-Together nach der Eröffnungsveranstaltung am Donnerstag und im Bootshaus am Freitag."
      },{
        question: "Was ist das Kasino? Wie sollte ich mich vorbereiten?",
        answer : "Am Samstag hast Du bei unserem Kasino die exklusive Möglichkeit, mit unseren Partnerunternehmen in Kontakt zu treten. Von zehn bis 14 Uhr kannst Du Dich in der Aula an den Ständen der Unternehmen über Karrieremöglichkeiten oder das Unternehmen allgemein informieren. Zur Vorbereitung kannst Du Dir <a href='#/app/partners'>hier</a> einmal unsere Partnerunternehmen ansehen."
      },{
        question: "Wie erfahre ich von möglichen Terminänderungen?",
        answer : "Über unseren App-Newsticker erfährst Du alle Änderungen und wichtigen Ereignisse."
      }
    ];

    $scope.questions_en = [
      {
        question: "Where can I check-in?",
        answer : "At the Check-in station in O 048 – the right way will be signposted. The check-in is open on Saturday from 08 to 11 am."
      },{
        question: "What is the nametag and the red wristband for? What happens if I lose it?",
        answer : "The nametag is your ticket to all events during the day. The wristband is your ticket to the closing party at Tiffany Club. Neither of them will be reissued, so please don’t lose either of them ;)"
      },{
        question: "Is there a dresscode?",
        answer : "There is no official, formal dresscode. However we suggest serious clothing during all events, based on the so-called „business casual“ to maintain and support the character of the event."
      },{
        question: "Which events can I go to?",
        answer : "You can go to the English main discussion (Mannheim Forum Spezial) as well as the workshop you received a separate email about. Of course, you can use every opportunity to eat and drink that we offer (lunch, coffee/cake in the afternoon) as well as go to our closing party at Tiffany Club if you have your wristband ready. We informed you about the workshop you can go to separately via email. If you forgot which workshop that was you can ask at the info-point."
      },{
        question: "What happens if I come to an event late or if it is full?",
        answer : "In case you are late you might miss the best part. However you can sneak in also after it already started if there is still seats available. You will be informed about that at the entrance. If there is no space left you can go to the Mannheim Forum Lounge and watch the live cast."
      },{
        question: "Do I need to bring my confirmation email to check-in or to the workshop?",
        answer : "No, simply come to the check-in and line up in the right queue (sorted according to last names). You will be asked to tell us your name and/or to show a valid ID card. The workshop speakers know that you are coming so you don’t need any proof of admittance."
      },{
        question: "Can I talk to speakers/moderators personally?",
        answer : "A personal discussion will probably not be possible. However there’s usually the chance to ask questions in the end of each event. Please use that opportunity."
      },{
        question: "Whom can I ask in case of questions?",
        answer : "Please call +49 (0) 157 54812371 if you need anything or if you have any questions. We can help you with basically everything."
      },{
        question: "Hungry – where and when can I eat?",
        answer : "There’s a lunch buffet on Saturday between 12 am and 2 pm at the Katakomben. In the afternoon there will be coffee and cake."
      },{
        question: "What is the Mannheim Forum Kasino? How can I prepare?",
        answer : "From 10 am to 2 pm you will have the chance to meet our corporate partners personally at the Kasino, which works somewhat like a career fair. Our partners are available at various fair stands at the Aula and look forward to answer your questions about the corporations and career possibilities. Check out our partner page to see who you can meet!"
      },{
        question: "How am I informed in case of changes/news?",
        answer : "Just keep following our newsticker within this App. All important information will be communicated there. Don’t worry if there will be some messages only in German – all information relevant to you will be translated and displayed in English."
      }
    ];

    var updateQuestions = function() {
      if(DataLanguage.currentLanguage() == 'en') {
        $scope.questions = $scope.questions_en;
      } else {
        $scope.questions = $scope.questions_de;
      }
    };
    $scope.$watch(DataLanguage.currentLanguage, function(oldVal, newVal) {
      if(oldVal != newVal) {
        updateQuestions();
      }
    });
    updateQuestions();


  })
;
