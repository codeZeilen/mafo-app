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

  .factory('Persistence', function($q, SpeakerAPI, EventAPI, EventHBTMSpeakerAPI, PartnerAPI) {
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

    entities.EventHBTMSpeaker = persistence.define('EventHBTMSpeaker', {
      speakerServerId: 'INT',
      eventServerId: 'INT'
    });

    persistence.debug = true;
    persistence.schemaSync();

    var refreshSpeakers = function(speakers) {
      return refreshAllOf(entities.Speaker, speakers);
    };

    var getAllSpeakers = function(speakersResult) {
      return getAllOf(entities.Speaker, speakersResult);
    };

    var refreshEvents = function(events) {
      return refreshAllOf(entities.Event, events);
    };

    var getAllEvents = function(events) {
      return getAllOf(entities.Event, events);
    };

    var refreshPartners = function(partners) {
      return refreshAllOf(entities.Partner, partners);
    };

    var getAllPartners = function(partnersResult) {
      return getAllOf(entities.Partner, partnersResult);
    };

    var refreshAllOf = function(entityClass, individuals) {
      if(individuals.length == 0) {
        // Safe-guard against wrong data. TODO: Maybe stronger
        return false;
      } else {
        entityClass.all().destroyAll();
        persistence.flush(function() {
          angular.forEach(individuals, function(individual) {
            persistence.add(new entityClass(individual));
          });
        });
      }
    };

    var getAllOf = function(entityClass, deferred) {
      entityClass.all().list(null, function (speakers) {
        deferred.resolve(speakers);
      });
    };

    var listing = function(ResourceApi, entityClass, refreshFn, getAllFn) {
      var result = $q.defer();

      entityClass.all().count(null, function (speakersCount) {
        if(speakersCount == 0) {
          // Refresh the cache
          var speakers = ResourceApi.query(function(speakers) {
            // TODO: check response
            refreshFn(speakers);
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
        return listing(SpeakerAPI, entities.Speaker, refreshSpeakers, getAllSpeakers);
      },

      /* Events */
      refreshEvents: refreshEvents,
      getEvent: function(eventId) {
        return getting(entities.Event, eventId);
      },
      listEvents: function() {
        return listing(EventAPI, entities.Event, refreshEvents, getAllEvents);
      },

      /* Partner */
      refreshPartners: refreshPartners,
      getPartner: function(partnerId) {
        return getting(entities.Partner, partnerId);
      },
      listPartners: function() {
        return listing(PartnerAPI, entities.Partner, refreshPartners, getAllPartners);
      }
    };
  });
