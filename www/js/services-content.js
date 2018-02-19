angular.module('starter.services')

.factory('ContentConfiguration', function() {

  // route part => { attributeName, entityName }
  return {
    "contentUpdateBaseURL": "https://anmeldung.mannheim-forum.org/api/mannheim-forum-schedule/%s/last_update_timestamp",
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
              var newTimeStamp = moment(angular.fromJson(requestResult)[0], "YYYY-MM-DD HH:mm");
              var oldTimeStamp = moment(timestampObjects[routeKey].timestamp, "YYYY-MM-DD HH:mm");
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

    if(storedTimeStamps.length === 0) {
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

});