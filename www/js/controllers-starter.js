angular.module('starter.controllers')

.controller('StarterCtrl', function($scope, $ionicModal, $state, $filter, Persistence, DataLanguage, NewsInterval, ContentUpdater, MafoTimeFormatter, PlannerContent, $q) {

  $scope.searchConfig = {"term" : ""};
  $scope.events = [];
  $scope.speakers = [];
  $scope.partners = [];
  $scope.news = [];

  $ionicModal.fromTemplateUrl('search-modal.html', {
    scope: $scope,
    animation: 'slide-in-up',
    focusFirstInput: false
  }).then(function(modal) {
    $scope.modal = modal;
  });

  var updateNews = function() {
    Persistence.listNews().then(function(news) {
      $scope.news = news;
    });
  };

  $scope.$watch(function() { return NewsInterval.newsItems }, function(oldVal, newVal) {
    if(!(oldVal === newVal)) {
      updateNews();
    }
  });
  updateNews();

  var convertEntityToData = function(entities) {
    return entities.map(function(e) {
      if(e.hasOwnProperty('_data')) {
        var d = e._data;
        d['_type'] = e['_type'];
        return d;
      } else {
        return e;
      }
    })
  };
  var filterSpeakersToShow = function(speakers) {
    return $filter('filter')(speakers, {isShownInList : 1});
  };
  var updateSearchItems = function() {
    if(DataLanguage.currentLanguage() === 'en') {
      updateEnglishSearchItems();
    } else {
      updateGermanSearchItems();
    }
  };
  var updateEnglishSearchItems = function() {
    $q.all([Persistence.listEvents(),
      Persistence.listSpeakers(),
      Persistence.listRooms()]).then(function(results) {
      $scope.events = convertEntityToData(results[0]);
      $scope.speakers = filterSpeakersToShow(convertEntityToData(results[1]));
      $scope.partners = [];
    });
  };
  var updateGermanSearchItems = function() {
    $q.all([Persistence.listEvents(),
      Persistence.listPartners(),
      Persistence.listRooms(),
      Persistence.listSpeakers()]).then(function(results) {
      $scope.events = convertEntityToData(results[0]);
      $scope.partners = convertEntityToData(results[1]);
      $scope.speakers = filterSpeakersToShow(convertEntityToData(results[3]));
    });
  };

  $scope.$watch(DataLanguage.currentLanguage, function(oldVal, newVal) {
    if(oldVal !== newVal) {
      updateSearchItems();
    }
  });
  $scope.$watch(function() {
    return ContentUpdater.updateCounter;
  }, function(oldVal, newVal) {
    updateSearchItems();
  });
  updateSearchItems();


  Persistence.listNews().then(function(news) {
    $scope.news = news;
  });

  $scope.gotoItem = function(newsItemId) {
    $state.go("app.newsItem", { itemId : newsItemId });
  };

  $scope.startSearch = function() {
    $scope.modal.show().then(function() {
      document.getElementById('searchModalInput').focus();
      if(device.platform === "Android") {
        cordova.plugins.Keyboard.show();
      }
    });
    return false;
  };

  $scope.stopSearch = function() {
    cordova.plugins.Keyboard.close();
    $scope.modal.hide();
  };

  $scope.exitSearch = function() {
    cordova.plugins.Keyboard.close();
    $scope.modal.hide();
  };

  $scope.compareMaFoObject = function(actual, expected) {
    if(typeof actual === 'string') {
      return actual.search(new RegExp(expected, "i")) > -1;
    }
  };

  /* Frankenstein code to cater for all types of items */
  $scope.itemConfigurations = {
    categoryColors : {},
    categoryNames : {}
  };

  Persistence.listCategories().then(function(categories) {
    angular.forEach(categories, function(category) {
      $scope.itemConfigurations.categoryColors[category.serverId] = '#' + category.color;
      $scope.itemConfigurations.categoryNames[category.serverId] = category.name;
    });
  });

  $scope.categoriesNotToShow = Persistence.Entities.EVENT_TYPES_TO_HIDE;
  $scope.eventCategoryNames = Persistence.Entities.EVENT_TYPES_LABEL_MAPPING;

  $scope.eventCategoryName = function(event) {
    return $scope.eventCategoryNames[event.eventType];
  };

  $scope.dateFormat = function(timeStampString) {
    return MafoTimeFormatter.formatNewsDate(timeStampString).concat(" Uhr");
  };
});