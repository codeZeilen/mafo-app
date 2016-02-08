angular.module('starter.services')
.factory('DataLanguage', function($translate) {
  var languageFacade = {
    "chosenLanguage" : 'de'
  };
  var availableLanguages = ['en', 'de'];

  var _setLanguageTo = function(languageCode) {
    languageFacade.chosenLanguage = languageCode;
    $translate.use(languageCode);
  };

  languageFacade.availableLanguages = function() {
    return availableLanguages;
  };

  languageFacade.setLanguageTo = function(languageCode) {
    if(availableLanguages.indexOf(languageCode) > -1) {
      _setLanguageTo(languageCode);
    }
    return languageFacade.chosenLanguage;
  };

  languageFacade.currentLanguage = function() {
    return languageFacade.chosenLanguage;
  };

  return languageFacade;
})

.factory('DataLanguageSetting', function(DataLanguage, Persistence, $ionicPopup, $rootScope) {
  var languageFacade = {};

  languageFacade.setLanguageTo = function(languageCode) {
    DataLanguage.setLanguageTo(languageCode);
    Persistence.setSetting('chosenLanguage', languageCode);
    return languageCode;
  };



  Persistence.getSetting('chosenLanguage').then(function(settingEntity) {
    if(settingEntity == null) {
      var $scope = $rootScope.$new();
      $scope.data = {};

      // Show alert
      $scope.languagePopup = $ionicPopup.show({
        scope: $scope,
        title: 'Sprachauswahl / Language Selection',
        template: '<p>Möchtest du die App für den International Day oder für die vollen drei Veranstaltungstage nutzen? Du kannst die App auch später noch umstellen.</p>' +
        '<p>Do you want to use the app for the international day or for the complete Mannheim Forum? You can also change this setting later on.</p>'
        + '<button class="button button-block button-positive" ng-click="setDe()">Komplettes Forum</button>'
        + '<button class="button button-block button-positive" ng-click="setEn()">International Day</button>'
      });

      $scope.setEn = function() {
        DataLanguage.setLanguageTo('en');
        $scope.languagePopup.close();
      };
      $scope.setDe = function() {
        DataLanguage.setLanguageTo('de');
        $scope.languagePopup.close();
      };

    } else {
      DataLanguage.setLanguageTo(settingEntity.settingsValue);
    }
  });

  return languageFacade;
});