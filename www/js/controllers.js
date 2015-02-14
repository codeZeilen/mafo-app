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

  $scope.shouldBeShown = function(speaker) {
    return speaker.isShownInList;
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

.controller('NewsCtrl', function($scope, Persistence, NewsInterval) {
    $scope.news = [];

    Persistence.listNews().then(function(news) {
      $scope.news = news;
      NewsInterval.start(function(newsItems) {
        $scope.news = newsItems;
        console.log(moment().format('HH:mm:ss: ') + 'Reloaded news');
      });
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

.controller('StarterCtrl', function($scope, $ionicModal, Persistence, $q) {

  $scope.searchConfig = {"term" : ""};
  $scope.events = [];
  $scope.speakers = [];
  $scope.partners = [];
  $scope.news = [];

  $ionicModal.fromTemplateUrl('search-modal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });

    Persistence.listNews().then(function(news) {
      $scope.news = news;
      NewsInterval.start(function(newsItems) {
        $scope.news = newsItems;
        console.log(moment().format('HH:mm:ss: ') + 'Reloaded news');
      });
    });

  $q.all([Persistence.listEvents(),
    Persistence.listPartners(),
    Persistence.listRooms(),
    Persistence.listSpeakers()]).then(function(results) {
    $scope.events = results[0];
    $scope.partners = results[1];
    $scope.speakers = results[3];
  });

  Persistence.listNews().then(function(news) {
    $scope.news = news;
  });

  $scope.startSearch = function() {
    $scope.modal.show();
  };

  $scope.stopSearch = function() {
    $scope.modal.hide();
  };

  $scope.exitSearch = function() {
    $scope.modal.hide();
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

  $scope.isWorkshop = function(event) {
    return [Persistence.Entities.EVENT_TYPES.UNTERNEHMENSWORKSHOP, Persistence.Entities.EVENT_TYPES.VERTIEFUNGSWORKSHOP]
        .indexOf(event.eventType) > 0;
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