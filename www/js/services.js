angular.module('starter.services', ['ngResource'])

.factory('SpeakerAPI', function($resource) {
    return $resource('https://www.mannheim-forum.org/api/mannheim-forum-schedule/speakers/:speakerId');
})

  .factory('Persistence', function($q, SpeakerAPI) {
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

    persistence.debug = true;
    persistence.schemaSync();

    var refreshSpeakers = function(speakers) {
        if(speakers.length == 0) {
          // Safe-guard against wrong data. TODO: Maybe stronger
          return false;
        } else {
          entities.Speaker.all().destroyAll();
          persistence.flush(function() {
            angular.forEach(speakers, function(speaker) {
              persistence.add(new entities.Speaker(speaker));
            });
          });
        }
      };

    var getAllSpeakers = function(speakersResult) {
      entities.Speaker.all().list(null, function (speakers) {
        speakersResult.resolve(speakers);
      });
    }

    return {
      Entities: entities,

      add: function(playlist) {
        persistence.add(playlist);
        persistence.flush();
      },

      getSpeaker: function(speakerId, successCallback) {
        var speakerResult = $q.defer();

        entities.Speaker.all().filter('serverId', '=', speakerId).one(function(speaker) {
          speakerResult.resolve(speaker);
        });

        return speakerResult.promise;
      },

      refreshSpeakers: refreshSpeakers,

      listSpeakers: function() {
        var speakersResult = $q.defer();

        entities.Speaker.all().count(null, function (speakersCount) {
          if(speakersCount == 0) {
            // Refresh the cache
            var speakers = SpeakerAPI.query(function(speakers) {
              // TODO: check response
              refreshSpeakers(speakers);
              getAllSpeakers(speakersResult);
            });
          } else {
            getAllSpeakers(speakersResult);
          }
        });

        return speakersResult.promise;
      }
    };
  })
