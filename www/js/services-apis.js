angular.module('starter.services')

.factory('SpeakerAPI', function($resource) {
  return $resource('https://anmeldung.mannheim-forum.org/api/mannheim-forum-schedule/speakers/:speakerId');
})

.factory('EventAPI', function($resource) {
  return $resource('https://anmeldung.mannheim-forum.org/api/mannheim-forum-schedule/events/:eventId');
})

.factory('EventHBTMSpeakerAPI', function($resource) {
  return $resource('https://anmeldung.mannheim-forum.org/api/mannheim-forum-schedule/event_speakers/:eventId');
})

.factory('PartnerAPI', function($resource) {
  return $resource('https://anmeldung.mannheim-forum.org/api/mannheim-forum-schedule/partners/:partnerId');
})

.factory('TopicCateogryAPI', function($resource) {
  return $resource('https://anmeldung.mannheim-forum.org/api/mannheim-forum-schedule/topic_categories/:partnerId');
})

.factory('RoomAPI', function($resource) {
  return $resource('https://anmeldung.mannheim-forum.org/api/mannheim-forum-schedule/rooms/:roomId');
})

.factory('NewsAPI', function($http, $q, $sanitize) {
  var processNewsItemConents = function(newsItems) {
    angular.forEach(newsItems, function(newsItem) {
      newsItem.content = $sanitize(newsItem.content);
      newsItem.content = newsItem.content.replace(/\/sites\/default\//,
          "https://anmeldung.mannheim-forum.org/sites/default/");
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

      $http.get('https://anmeldung.mannheim-forum.org/api/mannheim-forum-schedule/news')
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

      $http.get('https://anmeldung.mannheim-forum.org/api/mannheim-forum-schedule/news_since/' + $timestamp)
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
