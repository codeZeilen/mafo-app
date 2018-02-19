angular.module('starter.services')

.factory('ContactRequestOutbox', function($interval, Persistence, $http, $q) {
  var intervalPromise;

  var sending = function(afterAllCallback) {
    Persistence.listContactRequests().then(function(requests) {
      var promises = requests.map(function(request) {
        var result = $q.defer();
        $http.post("https://anmeldung.mannheim-forum.org/api/app_contact_request", request)
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
            if(requests.length === 0) {
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
});