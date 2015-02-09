angular.module('starter.services', ['ngResource'])

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

  .factory('Persistence', function($q, SpeakerAPI, EventAPI, EventHBTMSpeakerAPI, PartnerAPI, TopicCateogryAPI) {
    // Credits to https://github.com/bgoetzmann/ionic-persistence/

    persistence.store.cordovasql.config(persistence, 'mafo_app_db', '0.0.1', 'Cache for program data of mafo', 10 * 1024 * 1024, 0);

    var entities = {};

    entities.Speaker = persistence.define('Speaker', {
      serverId: 'INT',
      name: 'TEXT',
      title: 'TEXT',
      shortDescription: 'TEXT',
      longDescription: 'TEXT',
      picturePath: 'TEXT'
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

    entities.EventHBTMSpeaker = persistence.define('EventHBTMSpeaker', {
      speakerServerId: 'INT',
      eventServerId: 'INT'
    });

    persistence.debug = true;
    persistence.schemaSync();

    var refreshSpeakers = function() {
      var result = $q.defer();
      refreshAllOf(SpeakerAPI, entities.Speaker).then(function() {
        refreshAllOf(EventHBTMSpeakerAPI, entities.EventHBTMSpeaker).then(function() {
          result.resolve();
        });
      });
      return result.promise;
    };

    var getAllSpeakers = function(speakersResult) {
      return getAllOf(entities.Speaker, speakersResult);
    };

    var refreshEvents = function() {
      var result = $q.defer();
      refreshAllOf(EventAPI, entities.Event).then(function(){
        refreshAllOf(EventHBTMSpeakerAPI, entities.EventHBTMSpeaker).then(function() {
          result.resolve()
        });
      });
      return result.promise;
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
            result.resolve();
          });
        }
      });
      return result.promise;
    };

    var getAllOf = function(entityClass, deferred) {
      entityClass.all().list(null, function (speakers) {
        deferred.resolve(speakers);
      });
    };

    var listing = function(entityClass, refreshFn, getAllFn) {
      var result = $q.defer();

      entityClass.all().count(null, function (speakersCount) {
        if(speakersCount == 0) {
          // Refresh the cache
          refreshFn().then(function() {
            getAllFn(result);
          });
        } else {
          getAllFn(result);
        }
      });

      return result.promise;
    };

    var getting = function(entityClass, speakerId) {
        var result = $q.defer();

        entityClass.all().filter('serverId', '=', speakerId).one(function(individual) {
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
        var result = $q.defer();
        entities.EventHBTMSpeaker.all().filter('speakerServerId', '=', speakerId).list(function(eventServerIds) {
          if(eventServerIds.length > 0) {
            var ids = eventServerIds.map(function(eventServerId) {
              return eventServerId.eventServerId;
            });
            entities.Event.all().filter('serverId', 'in', ids).list(null, function(events) {
              result.resolve(events);
            });
          } else {
            result.resolve([]);
          }
        });
        return result.promise;
      },

      /* Events */
      refreshEvents: refreshEvents,
      getEvent: function(eventId) {
        return getting(entities.Event, eventId);
      },
      listEvents: function() {
        return listing(entities.Event, refreshEvents, getAllEvents);
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
      getCategory: function(categoryServerId) {
        var result = $q.defer();
        entities.TopicCategory.all().count(null, function (speakersCount) {
          var intermediate_defer = $q.defer();
          var intermediate_result = intermediate_defer.promise;
          if(speakersCount == 0) {
            intermediate_result = refreshAllOf(TopicCateogryAPI, entities.TopicCategory);
          } else {
            intermediate_defer.resolve();
          }
          intermediate_result.then(function() {
            getting(entities.TopicCategory, categoryServerId).then(function(category) {
              result.resolve(category);
            })
          });
        });
        return result.promise;
      }
    };
  });
