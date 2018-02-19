angular.module('starter.controllers')

.controller('AppCtrl', function($scope, $ionicModal, $timeout, $ionicHistory, DataLanguage, DataLanguageSetting) {
  // Form data for the login modal
  $scope.loginData = {};
  $scope.visibleSubMenus = {
    'eventInfo' : true,
    'personal' : true,
    'socialMedia' : true,
    'language' : false,
  };
  $scope.visibleMenuItemsPerLanguage = {
    'en' :
        ['news', 'contact', 'program', 'speakers', 'map', 'faq', 'info', 'internationalFacebookEvent'],
    'de' :
        ['planer', 'news', 'contact', 'program', 'speakers', 'partners', 'map', 'faq', 'info']
  };

  $scope.toggleSubMenuVisibility = function(subMenuName) {
    $scope.visibleSubMenus[subMenuName] = !$scope.visibleSubMenus[subMenuName];
  };

  $scope.subMenuVisible = function(subMenuName) {
    return $scope.visibleSubMenus[subMenuName];
  };

  $scope.menuItemVisible = function(menuItemIdentifier) {
    return $scope.visibleMenuItemsPerLanguage[$scope.selectedLanguage].indexOf(menuItemIdentifier) > -1;
  };

  $scope.toAppHome = function() {
    $ionicHistory.clearHistory();
    $ionicHistory.nextViewOptions({
      disableAnimate: false,
      disableBack: true
    });
  };


  $scope.selectedLanguage = DataLanguage.currentLanguage();
  $scope.$watch(DataLanguage.currentLanguage, function(oldVal, newVal) {
    if(oldVal !== newVal) {
      $scope.selectedLanguage = DataLanguage.currentLanguage();
    }
  });

  $scope.setLanguageToEnglish = function() {
    DataLanguageSetting.setLanguageTo('en');
    $scope.toggleSubMenuVisibility('language');
  };

  $scope.setLanguageToGerman = function() {
    DataLanguageSetting.setLanguageTo('de');
    $scope.toggleSubMenuVisibility('language');
  };

  $scope.toWebpage = function() {
    window.open('https://www.mannheim-forum.org', '_system', 'location=no');
  };

  $scope.toYoutube = function() {
    window.open('https://www.youtube.com/user/MannheimForum', '_system', 'location=no');
  };

  $scope.toFacebookEvent = function() {
    window.open('https://www.facebook.com/events/351612011884757/', '_system', 'location=no');
  };

  $scope.toInternationalFacebookEvent = function() {
    window.open('https://www.facebook.com/events/487062954814467/', '_system', 'location=no');
  };

  $scope.toFacebookPage = function() {
    window.open('https://www.facebook.com/MannheimForum', '_system', 'location=no');
  };

  $scope.toInstagram = function() {
    window.open('https://www.instagram.com/mannheimforum/', '_system', 'location=no');
  };
})

.controller('SpeakersCtrl', function($scope, Persistence, DataLanguage) {
  $scope.speakers = [];

  $scope.lastName = function(speaker) {
    return speaker.name.split(' ').slice(-1)[0];
  };

  $scope.shouldBeShown = function(speaker) {
    return speaker.isShownInList === 1;
  };

  var updateSpeakers = function() {
    Persistence.listSpeakers().then(function (speakers) {
      $scope.speakers = speakers;
    });
  };

  updateSpeakers();
  $scope.$watch(DataLanguage.currentLanguage, function(oldVal, newVal) {
    if(oldVal !== newVal) {
      updateSpeakers();
    }
  })
});