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

.factory('DataLanguageSetting', function(DataLanguage, Persistence, $ionicPopup) {
  var languageFacade = {};

  languageFacade.setLanguageTo = function(languageCode) {
    DataLanguage.setLanguageTo(languageCode);
    Persistence.setSetting('chosenLanguage', languageCode);
    return languageCode;
  };

  Persistence.getSetting('chosenLanguage').then(function(settingEntity) {
    if(settingEntity == null) {
      // Show alert
      var languagePopup = $ionicPopup.show({
        title: 'Sprachauswahl / Language Selection',
        template: '<p>Möchtest du die App für den International Day oder für die vollen drei Veranstaltungstage nutzen? Du kannst die App auch später noch umstellen.</p>' +
        '<p>Do you want to use the app for the international day or for the complete Mannheim Forum? You can also change this setting later on.</p>',
        buttons: [{
          text: 'Alle drei Tage/Complete Forum',
          type: 'button-default',
          onTap: function(e) {
            return 'de';
          }
        }, {
          text: 'International Day',
          type: 'button-default',
          onTap: function(e) {
            return 'en';
          }
        }]
      });
      languagePopup.then(function(chosenLanguageCode) {
        DataLanguage.setLanguageTo(chosenLanguageCode);
      });
    } else {
      DataLanguage.setLanguageTo(settingEntity.settingsValue);
    }
  });

  return languageFacade;
});