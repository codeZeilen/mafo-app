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

    var updateInterface = {};
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

.factory('NewsInterval', function($interval, Persistence) {
  var intervalPromise;

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

  newsIntervalFacade.start = function() {
    if(!angular.isDefined(intervalPromise)){
      intervalPromise = $interval(updater, 5/*m*/ * 60/*s*/ * 1000 /*ms*/);
    }
    updater();
  };

  newsIntervalFacade.stop = function() {
    if(angular.isDefined(intervalPromise)) {
      $interval.cancel(intervalPromise);
    }
  };

  return newsIntervalFacade;
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

  .factory('Persistence', function($q, SpeakerAPI, EventAPI, EventHBTMSpeakerAPI, PartnerAPI, TopicCateogryAPI, RoomAPI, NewsAPI) {
    // Credits to https://github.com/bgoetzmann/ionic-persistence/

    persistence.store.cordovasql.config(persistence, 'mafo_app_db', '0.0.5', 'Cache for program data of mafo', 30 * 1024 * 1024, 0);

    var entities = {};

    entities.Speaker = persistence.define('Speaker', {
      serverId: 'INT',
      name: 'TEXT',
      title: 'TEXT',
      shortDescription: 'TEXT',
      longDescription: 'TEXT',
      picturePath: 'TEXT',
      isShownInList: 'INT'
    });

    entities.Event = persistence.define('Event', {
      serverId: 'INT',
      name: 'TEXT',
      shortDescription: 'TEXT',
      longDescription: 'TEXT',
      startTime: 'TEXT',
      endTime: 'TEXT',
      roomId: 'INT',
      categoryId: 'INT',
      companyId: 'INT',
      picturePath: 'TEXT',
      eventType: 'TEXT'
    });
    entities.EVENT_TYPES = {
      MAIN: 'main',
      EVENING: 'evening',
      VERTIEFUNGSWORKSHOP: 'vworkshop',
      UNTERNEHMENSWORKSHOP: 'uworkshop'
    };

    entities.Partner = persistence.define('Partner', {
      serverId: 'INT',
      name: 'TEXT',
      shortDescription: 'TEXT',
      longDescription: 'TEXT',
      website: 'TEXT',
      email: 'TEXT',
      nameOfContact: 'TEXT',
      address: 'TEXT',
      logoPath: 'TEXT'
    });

    entities.TopicCategory = persistence.define('TopicCategory', {
      serverId: 'INT',
      name: 'TEXT',
      color: 'TEXT'
    });

    entities.Room = persistence.define('Room', {
      serverId: 'INT',
      name: 'TEXT',
      capacity: 'INT',
      mapImagePath: 'TEXT'
    });

    entities.News = persistence.define('News', {
      serverId: 'INT',
      title: 'TEXT',
      content: 'TEXT',
      createdAt: 'TEXT'
    });

    entities.EventHBTMSpeaker = persistence.define('EventHBTMSpeaker', {
      speakerServerId: 'INT',
      eventServerId: 'INT'
    });

    entities.ContactRequest = persistence.define('ContactRequest', {
      firstName: "TEXT",
      lastName: "TEXT",
      email: "TEXT",
      message: "TEXT"
    });

    entities.ServerUpdateTimestamp = persistence.define('ServerUpdateTimestamp', {
      routeKey: "TEXT",
      timestamp: "TEXT"
    });

    persistence.debug = true;
    persistence.schemaSync();

    var refreshSpeakers = function() {
      return $q.all([
        refreshAllOf(SpeakerAPI, entities.Speaker),
        refreshAllOf(EventHBTMSpeakerAPI, entities.EventHBTMSpeaker),
        refreshAllOf(RoomAPI, entities.Room),
        refreshAllOf(TopicCateogryAPI, entities.TopicCategory),
        refreshAllOf(EventAPI, entities.Event)
      ]);

    };

    var getAllSpeakers = function(speakersResult) {
      return getAllOf(entities.Speaker, speakersResult);
    };

    var refreshEvents = function() {
      return $q.all([
        refreshAllOf(EventAPI, entities.Event),
        refreshAllOf(EventHBTMSpeakerAPI, entities.EventHBTMSpeaker),
        refreshAllOf(SpeakerAPI, entities.Speaker),
        refreshAllOf(RoomAPI, entities.Room),
        refreshAllOf(TopicCateogryAPI, entities.TopicCategory),
      ]);
    };

    var getAllEvents = function(events) {
      return getAllOf(entities.Event, events);
    };

    var getEventsForPartner = function(partnerId) {
      return function(result) {
        entities.Event.all().filter('companyId', '=', partnerId).list(null, function(events){
          result.resolve(events);
        })
      };
    };

    var refreshPartners = function() {
      return refreshAllOf(PartnerAPI, entities.Partner);
    };

    var getAllPartners = function(partnersResult) {
      return getAllOf(entities.Partner, partnersResult);
    };

    var refreshCategories = function() {
      return refreshAllOf(TopicCateogryAPI, entities.TopicCategory);
    };

    var getAllCategories = function(categoriesResult) {
      return getAllOf(entities.TopicCategory, categoriesResult);
    };

    var refreshRooms = function() {
      return $q.all([
        refreshAllOf(EventAPI, entities.Event),
        refreshAllOf(EventHBTMSpeakerAPI, entities.EventHBTMSpeaker),
        refreshAllOf(SpeakerAPI, entities.Speaker),
        refreshAllOf(RoomAPI, entities.Room),
        refreshAllOf(TopicCateogryAPI, entities.TopicCategory),
      ]);
    };

    var getAllRooms = function(roomsResult) {
      return getAllOf(entities.Room, roomsResult);
    };

    var refreshAllNews = function() {
      return refreshAllOf(NewsAPI, entities.News);
    };

    var incrementalRefreshNews = function() {
      var result = $q.defer();
      var intermediateResult = $q.defer();
      getAllNews(intermediateResult);
      intermediateResult.promise.then(function(news) {
        var creationTimestamps = news.map(function(newsItem) {
          return newsItem.createdAt;
        });
        var latestNewsTimestamp = 0;
        if(creationTimestamps.length > 0) {
          latestNewsTimestamp = Math.max.apply(null, creationTimestamps);
        };
        NewsAPI.refreshFrom(latestNewsTimestamp).then(function(newsItems) {
          angular.forEach(newsItems, function(newsItem) {
            persistence.add(new entities.News(newsItem));
          });
          persistence.flush(function() {
            result.resolve();
          });
        });
      });

      return result.promise;
    };

    var getAllNews = function(newsResult) {
      return getAllOf(entities.News, newsResult);
    };

    var refreshAllOf = function(ResourceApi, entityClass) {
      var result = $q.defer();
      ResourceApi.query(function(individuals) {
        //TODO: check response
        if(individuals.length == 0) {
          // Safe-guard against wrong data. TODO: Maybe stronger
          return false;
        } else {
          entityClass.all().destroyAll();
          persistence.flush(function() {
            angular.forEach(individuals, function(individual) {
              persistence.add(new entityClass(individual));
            });
            persistence.flush(function() {
              result.resolve();
            });
          });
        }
      });
      return result.promise;
    };

    var getAllOf = function(entityClass, deferred) {
      entityClass.all().list(null, function (individuals) {
        deferred.resolve(individuals);
      });
    };

    var listing = function(entityClass, _, getAllFn) {
      var result = $q.defer();
      getAllFn(result);
      return result.promise;
    };

    var listingViaHBTM = function(hbtmEntity, sourceId, sourceAttribute, targetEntity, targetAttribute) {
      var result = $q.defer();
      hbtmEntity.all().filter(sourceAttribute, '=', sourceId).list(function(eventServerIds) {
        if(eventServerIds.length > 0) {
          var ids = eventServerIds.map(function(eventServerId) {
            return eventServerId[targetAttribute];
          });
          targetEntity.all().filter('serverId', 'in', ids).list(null, function(events) {
            result.resolve(events);
          });
        } else {
          result.resolve([]);
        }
      });
      return result.promise;
    };

    var getting = function(entityClass, individualServerId) {
        var result = $q.defer();

        entityClass.all().filter('serverId', '=', individualServerId).one(function(individual) {
          result.resolve(individual);
        });

        return result.promise;
    };

    return {
      Entities: entities,

      add: function(playlist) {
        persistence.add(playlist);
        persistence.flush();
      },

      /* Speakers */
      refreshSpeakers: refreshSpeakers,
      getSpeaker: function(speakerId) {
        return getting(entities.Speaker, speakerId);
      },
      listSpeakers: function() {
        return listing(entities.Speaker, refreshSpeakers, getAllSpeakers);
      },
      eventsForSpeaker: function(speakerId) {
        return listingViaHBTM(entities.EventHBTMSpeaker,
                              speakerId, 'speakerServerId',
                              entities.Event, 'eventServerId');
      },

      /* Events */
      refreshEvents: refreshEvents,
      getEvent: function(eventId) {
        return getting(entities.Event, eventId);
      },
      listEvents: function() {
        return listing(entities.Event, refreshEvents, getAllEvents);
      },
      listSpeakersForEvent: function(eventId) {
        return listingViaHBTM(entities.EventHBTMSpeaker,
          eventId, 'eventServerId',
          entities.Speaker, 'speakerServerId');
      },

      /* Partner */
      refreshPartners: refreshPartners,
      getPartner: function(partnerId) {
        return getting(entities.Partner, partnerId);
      },
      listPartners: function() {
        return listing(entities.Partner, refreshPartners, getAllPartners);
      },
      getWorkshopsOfPartner: function(partnerId) {
        return listing(entities.Event, refreshEvents, getEventsForPartner(partnerId));
      },

      /* Topic category */
      refreshCategories: refreshCategories,
      listCategories: function() {
        return listing(entities.TopicCategory, refreshCategories, getAllCategories);
      },

      /* Rooms */
      refreshRooms: refreshRooms,
      listRooms: function() {
        return listing(entities.Room, refreshRooms, getAllRooms);
      },
      getRoom: function(roomId) {
        return getting(entities.Room, roomId);
      },

      /* News */
      incrementalRefreshNews: incrementalRefreshNews,
      listNews: function() {
        return listing(entities.News, refreshAllNews, getAllNews);
      },
      getNewsItem: function(itemId) {
        return getting(entities.News, itemId);
      },
      /* ContactRequest */
      addContactRequest: function(message) {
        var result = $q.defer();
        persistence.add(new entities.ContactRequest(message));
        persistence.flush(function() {
          result.resolve();
        });
        return result.promise;
      },
      removeContactRequest: function(request) {
        persistence.remove(request);
        persistence.flush();
      },
      listContactRequests: function() {
        var result = $q.defer();
        getAllOf(entities.ContactRequest, result);
        return result.promise;
      }
    };
  });
