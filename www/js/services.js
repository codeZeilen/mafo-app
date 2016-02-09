angular.module('starter.services', ['ngResource'])

.factory('ContentConfiguration', function() {

    // route part => { attributeName, entityName }
    return {
      "contentUpdateBaseURL": "https://www.mannheim-forum.org/api/mannheim-forum-schedule/%s/last_update_timestamp",
      "contentUpdateConfiguration": {
        "events" :
        {
          'attributeName'   : 'eventUpdateCounter',
          'entityName'      : 'Event',
          'refreshFunction' : 'refreshEvents'
        },
        "speakers" :
        {
          'attributeName'   : 'speakerUpdateCounter',
          'entityName'      : 'Speaker',
          'refreshFunction' : 'refreshSpeakers'
        },
        "partners" :
        {
          'attributeName'   : 'partnerUpdateCounter',
          'entityName'      : 'Partner',
          'refreshFunction' : 'refreshPartners'
        },
        "rooms" :
        {
          'attributeName'   : 'roomUpdateCounter',
          'entityName'      : 'Room',
          'refreshFunction' : 'refreshRooms'
        },
        "topic_categories" :
        {
          'attributeName'   : 'topicCategoryUpdateCounter',
          'entityName'      : 'TopicCategory',
          'refreshFunction' : 'refreshCategories'
        },
        "event_speakers" :
        {
          'attributeName'   : 'eventSpeakersUpdateCounter',
          'entityName'      : 'EventHBTMSpeaker',
          'refreshFunction' : 'refreshEvents'
        }
      }
    };

})

.factory('ContentInitializer', function($q, $http, Persistence, ContentConfiguration) {

    var initStarted = false;

    return {
      init: function() {

        var initializationDone = $q.defer();
        if(!initStarted) {
          initStarted = true;
          $http.get('content.json')
            .success(function (fileContent) {
              var entitiesInitialized = [];
              var entitiesContent = angular.fromJson(fileContent);
              angular.forEach(entitiesContent, function (entityContent) {
                var entityDone = $q.defer();
                entitiesInitialized.push(entityDone);

                var entityName = ContentConfiguration.contentUpdateConfiguration[entityContent.routeKey].entityName;
                var entity = Persistence.Entities[entityName];
                angular.forEach(entityContent.individuals, function (individualContent) {
                  persistence.add(new entity(individualContent));
                });
                persistence.flush(function () {
                  var timestampObject = new Persistence.Entities.ServerUpdateTimestamp({
                    'routeKey': entityContent.routeKey,
                    'timestamp': entityContent.timestamp
                  });
                  persistence.add(timestampObject);
                  persistence.flush(function() {
                    entityDone.resolve(timestampObject);
                  });
                });
              });

              $q.all(entitiesInitialized).then(function(timestamps) {
                initializationDone.resolve(timestamps);
              })
            });
        }

        return initializationDone.promise;
      }
    };
})

.factory('ContentUpdater', function($interval, Persistence, $http, $q, ContentInitializer, ContentConfiguration) {

    var baseURL = ContentConfiguration.contentUpdateBaseURL;
    var apiConfiguration = ContentConfiguration.contentUpdateConfiguration;

    var updateInterface = { 'updateCounter' : 0 };
    angular.forEach(Object.keys(apiConfiguration), function(routeKey) {
      updateInterface[apiConfiguration[routeKey].attributeName] = 0;
    });


    var timestampObjects = {};
    var cacheTimestampObjects = function(storedTimeStamps) {
      angular.forEach(storedTimeStamps, function(ts) {
        timestampObjects[ts.routeKey] = ts;
      });
    };

    var updater = function() {
      // This assumes that all routeKeys listed in the configuration are initialized with timestamps --pre
      Persistence.Entities.ServerUpdateTimestamp.all().list(null, function(storedTimeStamps) {
        cacheTimestampObjects(storedTimeStamps);
        angular.forEach(Object.keys(apiConfiguration), function(routeKey) {
          $http.get(baseURL.replace("%s", routeKey))
            .success(function(requestResult) {
              var newTimeStamp = moment(angular.fromJson(requestResult)[0], "MM-DD-YYYY HH:mm");
              var oldTimeStamp = moment(timestampObjects[routeKey].timestamp, "MM-DD-YYYY HH:mm");
              if(newTimeStamp > oldTimeStamp) {
                Persistence[apiConfiguration[routeKey].refreshFunction]().then(function() {
                  updateInterface[apiConfiguration[routeKey].attributeName] += 1;
                  updateInterface.updateCounter += 1;
                  timestampObjects[routeKey].timestamp = requestResult;
                  persistence.flush();
                });
              }
            });
        });
      });
    };

    var intervalPromise;
    var startRefreshInterval = function() {
      intervalPromise = $interval(updater, 15/*m*/ * 60 /*s*/ * 1000 /*ms*/);
    };

    Persistence.Entities.ServerUpdateTimestamp.all().list(null, function(storedTimeStamps) {
      // if no timestamps available then initialize the thing
      var contentInitialized = $q.defer();

      if(storedTimeStamps.length == 0) {
        ContentInitializer.init().then(function(storedTimeStamps) {
          contentInitialized.resolve(storedTimeStamps);
        });
      } else {
        contentInitialized.resolve(storedTimeStamps);
      }

      contentInitialized.promise.then(function(timeStamps) {
        cacheTimestampObjects(timeStamps);
        updater();
        startRefreshInterval();
      });

    });

    return updateInterface;

})

.factory('NewsInterval', function($interval, $http, Persistence) {
  var intervalPromise;
  var started = false;

  var newsIntervalFacade = {
    newsUpdateCounter : 0,
    newsItems: []
  };

  var updater = function() {
    Persistence.incrementalRefreshNews().then(function() {
      Persistence.listNews().then(function(newsItems) {
        newsIntervalFacade.newsItems = newsItems;
      });
    });
  };

  var startUp = function() {
    if(!angular.isDefined(intervalPromise)){
      intervalPromise = $interval(updater, 5/*m*/ * 60/*s*/ * 1000 /*ms*/);
    }
    updater();
  };

  newsIntervalFacade.start = function() {
    if(!started) {
    started = true;
    Persistence.listNews().then(function(newsItems) {
      if(newsItems.length > 0) {
        startUp();
      } else {
        $http.get('newsItems.json')
          .success(function(result) {
            var newNewsItems = angular.fromJson(result);
            angular.forEach(newNewsItems, function(newsItem) {
              persistence.add(new Persistence.Entities.News(newsItem));
            });
            persistence.flush(startUp);
          });
      }
    });
    }
  };

  newsIntervalFacade.stop = function() {
    if(angular.isDefined(intervalPromise)) {
      $interval.cancel(intervalPromise);
      started = false;
    }
  };

  return newsIntervalFacade;
})

.factory('EventUtil', function() {
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

    return {
      daysToObjects : daysToObjects,
      groupDays     : groupDays
    }
})
    
.factory('PartnerStatus', function() {
  var statusLabels = {'none': "Weitere Partner",
      'premium': "Premium Partner",
      'workshop': "Workshop Partner",
      'flagship': "Flagship Partner",
      'long_tem': "Long Term Partner",
      'friends': "Circle of Friends",
      'supply': "Supply Partner",
      'startup': "StartUp Partner",
};
  
  return {
   'statusLabels' : statusLabels,
  }
})

.factory('ContactRequestOutbox', function($interval, Persistence, $http, $q) {
  var intervalPromise;

  var sending = function(afterAllCallback) {
    Persistence.listContactRequests().then(function(requests) {
      var promises = requests.map(function(request) {
        var result = $q.defer();
        $http.post("https://www.mannheim-forum.org/api/app_contact_request", request)
          .success(function() {
            Persistence.removeContactRequest(request);
            result.resolve();
          })
          .error(function() {
            startRetry();
            result.resolve();
          });
        return result.promise;
      });
      $q.all(promises).then(afterAllCallback);
    });
  };

  var startRetry = function() {
    if(!angular.isDefined(intervalPromise)){
      intervalPromise = $interval(function() {

        sending(function() {
          Persistence.listContactRequests().then(function(requests) {
            if(requests.length == 0) {
              stopRetry();
            }
          })
        });

      }, 5/*m*/ * 60/*s*/ * 1000 /*ms*/);
    }
  };

  var stopRetry = function() {
    if(angular.isDefined(intervalPromise)) {
      $interval.cancel(intervalPromise);
    }
  };

  return {
    send : function() {
      sending(function() {});
    },
    stopRetry : stopRetry
  };
})

.factory('SpeakerAPI', function($resource) {
    return $resource('https://www.mannheim-forum.org/api/mannheim-forum-schedule/speakers/:speakerId');
})

.factory('EventAPI', function($resource) {
  return $resource('https://www.mannheim-forum.org/api/mannheim-forum-schedule/events/:eventId');
})

  .factory('EventHBTMSpeakerAPI', function($resource) {
    return $resource('https://www.mannheim-forum.org/api/mannheim-forum-schedule/event_speakers/:eventId');
  })

  .factory('PartnerAPI', function($resource) {
    return $resource('https://www.mannheim-forum.org/api/mannheim-forum-schedule/partners/:partnerId');
  })

  .factory('TopicCateogryAPI', function($resource) {
    return $resource('https://www.mannheim-forum.org/api/mannheim-forum-schedule/topic_categories/:partnerId');
  })

  .factory('RoomAPI', function($resource) {
    return $resource('https://www.mannheim-forum.org/api/mannheim-forum-schedule/rooms/:roomId');
  })

  .factory('NewsAPI', function($http, $q, $sanitize) {
    var processNewsItemConents = function(newsItems) {
      angular.forEach(newsItems, function(newsItem) {
        newsItem.content = $sanitize(newsItem.content);
        newsItem.content = newsItem.content.replace(/\/sites\/default\//, "https://www.mannheim-forum.org/sites/default/");
        newsItem.content = newsItem.content.replace(/img/, "img ng-cache");
        newsItem.content = newsItem.content.replace(/src=/, "ng-src=");
        var regex = /href="([\S]+)"/g;
        newsItem.content = newsItem.content.replace(regex, "href=\"#\" onClick=\"window.open('$1', '_system', 'location=yes')\"");
      });

      return newsItems;
    };

    return {
      'query': function(callback) {
        var result = $q.defer();

        $http.get('https://www.mannheim-forum.org/api/mannheim-forum-schedule/news')
          .success(function(requestResult) {
            result.resolve(processNewsItemConents(angular.fromJson(requestResult)));
          })
          .error(function() {
            result.resolve([]);
          });

        return result.promise.then(callback);
      },
      'refreshFrom': function($timestamp) {
        var result = $q.defer();

        $http.get('https://www.mannheim-forum.org/api/mannheim-forum-schedule/news_since/' + $timestamp)
          .success(function(requestResult) {
            result.resolve(processNewsItemConents(angular.fromJson(requestResult)));
          })
          .error(function() {
            result.resolve([]);
          });

        return result.promise;
      }
    };
  })

.factory('PlannerContent', function(Persistence, $timeout, $ionicPopup) {

    var minutesPerSlot = 15;
    var startHour = 7;
    var endHour = 24;

    var fixedEvents = [
      {
        'name': 'Check-In in O048',
        'roomId': 3,
        'startTime': moment('03-10-2016 16:00', 'MM-DD-YYYY HH:mm'),
        'endTime':   moment('03-10-2016 20:00', 'MM-DD-YYYY HH:mm'),
        'durationInMinutes' : 30,
        'isFixedEvent' : true
      },
      {
        'name': 'Check-In in O048',
        'roomId': 3,
        'startTime': moment('03-11-2016 07:00', 'MM-DD-YYYY HH:mm'),
        'endTime':   moment('03-11-2016 11:00', 'MM-DD-YYYY HH:mm'),
        'durationInMinutes' : 30,
        'isFixedEvent' : true
      },
      {
        'name': 'Check-In for Internationals in O 048',
        'roomId': 7,
        'startTime': moment('03-12-2016 08:00', 'MM-DD-YYYY HH:mm'),
        'endTime':   moment('03-12-2016 11:00', 'MM-DD-YYYY HH:mm'),
        'durationInMinutes' : 30,
        'isFixedEvent' : true
      },
    ];

    var alarms = {};
    var setAlarm = function(event) {
      if(!angular.isDefined(event.startTime)) {
        return false;
      }
      var reminderStart = moment(event.startTime);
      reminderStart.subtract(moment.duration(10, 'minutes'));

      if(reminderStart > moment() && !angular.isDefined(alarms[event.serverId])) {
        console.log("set alarm");
        var delayMs = reminderStart.diff(moment());
        delayMs = Math.min(delayMs, 2147483647); // Prevents an overflow in $timeout
        var popupShown = false;
        alarms[event.serverId] = $timeout(function() {
          if(!popupShown) {
            popupShown = true;
            var alertPopup = $ionicPopup.alert({
              title: 'Erinnerung',
              template: 'Die Veranstaltung ' + event.name + ' beginnt in 10 Minuten.'
            });
            alertPopup.then(function(res) {});
          }
        },
        delayMs);
      }
    };
    var cancelAlarm = function(event) {
      if(angular.isDefined(alarms[event.serverId])) {
        $timeout.cancel(alarms[event.serverId]);
      }
    };

    var allEvents = [];

    var favoriteEvents = [];
    Persistence.listFavoriteEvents().then(function(persistedFavoriteEvents) {
      favoriteEvents = persistedFavoriteEvents;
      angular.forEach(persistedFavoriteEvents, setAlarm);
      allEvents = allEvents.concat(persistedFavoriteEvents);
    });

    var userEvents = [];
    Persistence.listUserEvents().then(function(persistedUserEvents) {
      userEvents = persistedUserEvents;
      allEvents = allEvents.concat(persistedUserEvents);
    });

    var isFavorite = function(event) {
      return favoriteEvents.indexOf(event) > -1;
    };

    return {
      getAllEvents : function() { return allEvents },
      getFavoriteEvents : function() { return favoriteEvents },
      isFavoriteEvent : isFavorite,
      favoriteEvent : function(event) {
        allEvents.push(event);
        favoriteEvents.push(event);
        setAlarm(event);
        Persistence.addFavoriteEvent(event.serverId);
      },
      removeFavoriteEvent : function(event) {
        var index = favoriteEvents.indexOf(event);
        if(index > -1) {
          favoriteEvents.splice(index, 1);
        }
        index = allEvents.indexOf(event);
        if(index > -1) {
          allEvents.splice(index, 1);
        }
        cancelAlarm(event);
        Persistence.removeFavoriteEvent(event.serverId);
      },
      getUserEvents : function() { return userEvents },
      saveUserEvent : function(eventData) {
        Persistence.addUserEvent(eventData).then(function(persistedUserEvent) {
          userEvents.push(persistedUserEvent);
          allEvents.push(persistedUserEvent);
        });
      },
      removeUserEvent : function(event) {
        var index = userEvents.indexOf(event);
        if(index > -1) {
          userEvents.splice(index, 1);
        }
        index = allEvents.indexOf(event);
        if(index > -1) {
          allEvents.splice(index, 1);
        }
        Persistence.removeUserEvent(event);
      },
      slotsForDay : function(day) {
        var startDay = moment(day);
        var endOfDay = moment(startDay);
        endOfDay.add(moment.duration(1, 'days'));

        var dayEvents = [];
        angular.forEach(favoriteEvents.concat(fixedEvents).concat(userEvents), function(event) {
          if (moment(event.startTime).isBetween(startDay, endOfDay)) {
            dayEvents.push(event);
          }
        });

        var daySlots = [];
        for (var i = 0; i < (endHour - startHour) * (60 / minutesPerSlot); i++) {
          var time = moment(startDay);
          time.add(moment.duration(startHour, 'hours'));
          time.add(moment.duration(i * minutesPerSlot, 'minutes'));

          // Filter events in between
          var events = [];
          var endTime = moment(time);
          endTime.add(moment.duration(minutesPerSlot, 'minutes'));
          var startTime = moment(time);
          startTime.subtract(moment.duration(1, 'minutes'));
          angular.forEach(dayEvents, function (event) {
            if (moment(event.startTime).isBetween(startTime, endTime)) {
              var offset = moment(event.startTime);
              offset.subtract(startTime);
              event['offset'] = moment.duration(offset.hours() * 60 + offset.minutes(), 'minutes');

              event['timeString'] = moment(event.startTime).format("HH:mm").concat(" - ").concat(moment(event.endTime).format("HH:mm"));
              events.push(event);
            }
          });

          daySlots.push({
            timestamp: time,
            timeString: time.format("HH:mm"),
            events: events
          });
        }

        return daySlots;
      }

    }
})

.factory('TopicCategoryService', function($rootScope, Persistence, ContentUpdater) {

    var categoryColors = {};
    var categoryNames = {};
    var englishCategoryNames = {};

    var updater = function() {
      Persistence.listCategories().then(function(categories) {
        categoryColors = {};
        categoryNames = {};
        englishCategoryNames = {};
        angular.forEach(categories, function(category) {
          categoryColors[category.serverId] = '#' + category.color;
          categoryNames[category.serverId] = category.name;
          englishCategoryNames[category.serverId] = category.name_en;
        });
      });
    };

    $rootScope.$watchCollection(function() { return ContentUpdater.topicCategoryUpdateCounter }, function(oldVal, newVal) {
      updater();
    });
    updater();

    return {
      categoryColorFromId : function(categoryId) {
        return categoryColors[categoryId];
      },
      categoryNameFromId : function(categoryId, languageCode) {
        if(languageCode == 'en') {
          return englishCategoryNames[categoryId];
        } else {
          return categoryNames[categoryId];
        }
      }
    }

})

.factory('MafoTimeFormatter', function() {
    return {
      formatTime : function(timestamp) {
        return moment(timestamp).format("HH:mm");
      },
      formatNewsDate : function(timestamp) {
        var time = moment(timestamp, "X");
        return time.format("DD. MMM YYYY, HH");
      }
    }
});
