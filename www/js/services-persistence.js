angular.module('starter.services'
)
.factory('Persistence', function($q, $filter, DataLanguage, SpeakerAPI, EventAPI, EventHBTMSpeakerAPI, PartnerAPI, TopicCateogryAPI, RoomAPI, NewsAPI) {
  // Credits to https://github.com/bgoetzmann/ionic-persistence/

  persistence.store.cordovasql.config(persistence, 'mafo_app_db', '0.0.1', 'Cache for program data of mafo', 30 * 1024 * 1024, 0);

  var entities = {};

  entities.Speaker = persistence.define('Speaker', {
    serverId: 'INT',
    name: 'TEXT',
    title: 'TEXT',
    shortDescription: 'TEXT',
    longDescription: 'TEXT',
    picturePath: 'TEXT',
    isShownInList: 'INT',
    shortDescription_en: 'TEXT',
    longDescription_en: 'TEXT',
    isAvailableInEnglishApp: 'INT'
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
    eventType: 'TEXT',
    name_en: 'TEXT',
    shortDescription_en: 'TEXT',
    longDescription_en: 'TEXT',
    isAvailableInEnglishApp: 'INT'
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
    logoPath: 'TEXT',
    partnerStatus: 'TEXT'
  });

  entities.TopicCategory = persistence.define('TopicCategory', {
    serverId: 'INT',
    name: 'TEXT',
    name_en: 'TEXT',
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

  entities.FavoriteEvent = persistence.define('FavoriteEvent', {
    serverId: 'INT'
  });

  entities.UserEvent = persistence.define('UserEvent', {
    name : 'TEXT',
    startTime : 'TEXT',
    endTime : 'TEXT',
    location : 'TEXT'
  });

  entities.AppSettings = persistence.define('AppSettings', {
    settingsKey : 'TEXT',
    settingsValue : 'TEXT',
  });

  persistence.debug = false;
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

  var dispatchPerLanguage = function(languageToFunction, argument) {
    return languageToFunction[DataLanguage.currentLanguage()](argument);
  };

  var filteringEntitiesAvailableInEnglish = function(aPromise) {
    return dispatchPerLanguage({
      'de' : function(arg) {return arg;},
      'en' : function(listPromise) {
        var result = $q.defer();

        listPromise.then(function(individuals) {
          result.resolve($filter('filter')(individuals, {'isAvailableInEnglishApp' : 1}));
        });

        return result.promise;
      }
    }, aPromise);
  };

  var filteringSpeakerList = function(speakerListPromise) {
    return filteringEntitiesAvailableInEnglish(speakerListPromise);
  };

  var filteringEventList = function(eventListPromise) {
    return filteringEntitiesAvailableInEnglish(eventListPromise);
  };

  var translateEntity = function(entityPromise) {
    return dispatchPerLanguage({
      'de' : function(arg) {return arg;},
      'en' : function(anEntityPromise) {
        var result = $q.defer();

        anEntityPromise.then(function(individual) {
          var newIndividual = {};
          for(var key in individual._data) {
            if(individual.hasOwnProperty(key)) {
              if(individual.hasOwnProperty(key + '_en')) {
                newIndividual[key] = individual[key + '_en'];
              } else {
                newIndividual[key] = individual[key];
              }
            }
          }
          result.resolve(newIndividual);
        });

        return result.promise;
      }
    }, entityPromise);
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
      return translateEntity(getting(entities.Speaker, speakerId));
    },
    listSpeakers: function() {
      return filteringSpeakerList(listing(entities.Speaker, refreshSpeakers, getAllSpeakers));
    },
    eventsForSpeaker: function(speakerId) {
      return listingViaHBTM(entities.EventHBTMSpeaker,
        speakerId, 'speakerServerId',
        entities.Event, 'eventServerId');
    },

    /* Events */
    refreshEvents: refreshEvents,
    getEvent: function(eventId) {
      return translateEntity(getting(entities.Event, eventId));
    },
    listEvents: function() {
      return filteringEventList(listing(entities.Event, refreshEvents, getAllEvents));
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
    },

    /* Favorite Events */
    listFavoriteEventIds : function() {
      var result = $q.defer();
      entities.FavoriteEvent.all().list(null, function(ids) {
        result.resolve(ids.map(function(each) {
          return each.serverId;
        }));
      });
      return result.promise;
    },
    listFavoriteEvents : function() {
      var result = $q.defer();
      entities.FavoriteEvent.all().list(null, function(favoriteIds) {
        var idSet = {};
        angular.forEach(favoriteIds, function(idObject) {
          idSet[idObject.serverId] = true;
        });
        entities.Event.all().filter('serverId', 'in', Object.keys(idSet)).list(null, function(events) {
          result.resolve(events);
        })
      });
      return result.promise;
    },
    listUserEvents : function() {
      var result = $q.defer();
      entities.UserEvent.all().list(null, function(events) {
        angular.forEach(events, function(event) {
          event.isUserEvent = true;
        });
        result.resolve(events);
      });
      return result.promise;
    },
    addUserEvent : function(event) {
      var done = $q.defer();
      var newEvent = new entities.UserEvent(event);
      persistence.add(newEvent);
      persistence.flush(function() {
        newEvent.isUserEvent = true;
        done.resolve(newEvent);
      });
      return done.promise;
    },
    removeUserEvent : function(event) {
      var done = $q.defer();
      persistence.remove(event);
      persistence.flush(done.resolve);
      return done.promise;
    },
    addFavoriteEvent : function(eventServerId) {
      var result = $q.defer();
      persistence.add(new entities.FavoriteEvent({serverId : eventServerId}));
      persistence.flush(result.resolve);
      return result.promise;
    },
    removeFavoriteEvent : function(eventServerId) {
      var result = $q.defer();
      entities.FavoriteEvent.all().filter('serverId', '=', eventServerId).list(null, function(favorites) {
        angular.forEach(favorites, function(each) {
          persistence.remove(each);
        });
        persistence.flush(result.resolve);
      });
      return result.promise;
    },

    /* Settings */
    getSetting : function(settingKey) {
      var result = $q.defer();
      entities.AppSettings.all().filter("settingsKey", '=', settingKey).one(null, function(results) {
        result.resolve(results);
      });
      return result.promise;
    },
    setSetting: function(settingKey, settingValue) {
      var result = $q.defer();
      entities.AppSettings.all().filter("settingsKey", '=', settingKey).one(null, function(results) {
        if(results == null) {
          // Create new setting
          persistence.add(new entities.AppSettings({'settingsKey' : settingKey, 'settingsValue' : settingValue}));
        } else {
          results.settingsValue = settingValue;
        }
        persistence.flush();
        result.resolve();
      });
      return result.promise;
    },
  };
});
