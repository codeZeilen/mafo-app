angular.module('starter.services')
.factory('DataLanguage', function() {
  var languageFacade = {
    "chosenLanguage" : 'de'
  };
  var availableLanguages = ['en', 'de'];

  languageFacade.availableLanguages = function() {
    return availableLanguages;
  };

  languageFacade.setLanguageTo = function(languageCode) {
    if(availableLanguages.indexOf(languageCode) > -1) {
      languageFacade.chosenLanguage = languageCode;
    }
    return languageFacade.chosenLanguage;
  };

  languageFacade.currentLanguage = function() {
    return languageFacade.chosenLanguage;
  };

  return languageFacade;
});