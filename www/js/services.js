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
        var allDone = [];
        if(!initStarted) {
          initStarted = true;
          $http.get('content.json')
            .success(function (fileContent) {
              var entitiesContent = angular.fromJson(fileContent);
              angular.forEach(entitiesContent, function (entityContent) {
                var entityDone = $q.defer();
                allDone.push(entityDone);

                var entityName = ContentConfiguration.contentUpdateConfiguration[entityContent.routeKey].entityName;
                var entity = Persistence.Entities[entityName];
                angular.forEach(entityContent.individuals, function (individualContent) {
                  persistence.add(new entity(individualContent));
                });
                persistence.flush(function () {
                  persistence.add(new Persistence.Entities.ServerUpdateTimestamp({
                    'routeKey': entityContent.routeKey,
                    'timestamp': entityContent.timestamp
                  }));
                  persistence.flush(function () {
                    entityDone.resolve(entityContent.timestamp);
                  });
                });
              });
            });
        }

        return $q.all(allDone);
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
              var newTimeStamp = moment(angular.fromJson(requestResult)[0]);
              var oldTimeStamp = moment(timestampObjects[routeKey].timestamp);
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
  });

