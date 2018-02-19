angular.module('starter.controllers')

.controller('NewsCtrl', function($scope, $stateParams, $location, $anchorScroll, Persistence, MafoTimeFormatter, NewsInterval) {
  $scope.news = [];

  var updateNews = function() {
    Persistence.listNews().then(function(newsItems) {
      $scope.news = newsItems;
    });
  };

  $scope.$watch(function() { return NewsInterval.newsItems }, function(oldVal, newVal, scope) {
    if(!(oldVal === newVal)) {
      updateNews(scope);
    }
  });
  updateNews();

  $scope.dateFormat = function(timeStampString) {
    return MafoTimeFormatter.formatNewsDate(timeStampString).concat(" Uhr");
  };

})

.controller('NewsItemCtrl', function($scope, $stateParams, Persistence, MafoTimeFormatter) {
  $scope.newsItem = {};

  Persistence.getNewsItem($stateParams.itemId).then(function(newsItem) {
    $scope.newsItem = newsItem;
  });

  $scope.dateFormat = function(timeStampString) {
    return MafoTimeFormatter.formatNewsDate(timeStampString).concat(" Uhr");
  };

});