angular.module('starter.services')

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
});