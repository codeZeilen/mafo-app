angular.module('starter.services')

.factory('EventUtil', function() {
  var groupDays = function(events) {
    var days = {};
    angular.forEach(events, function(event) {
      var startTime = moment(event.startTime);
      var day = moment(startTime);
      day.startOf('day');
      if(!(day in days)) {
        days[day] = {};
      }
      if(!(startTime in days[day])) {
        days[day][startTime] = [];
      }
      days[day][startTime].push(event);

    });
    return days;
  };

  var daysToObjects = function(days) {
    var resultDays = [];
    angular.forEach(Object.keys(days), function(day) {
      var slots = [];
      angular.forEach(Object.keys(days[day]), function(timeslot) {
        slots.push({
          'startTime': moment(timeslot),
          'displayName' : moment(timeslot).format("HH:mm").concat(" Uhr"),
          'events' :  days[day][timeslot]
        });
      });
      resultDays.push({
        'day': moment(day),
        'displayName' : moment(day).format("dd, D.MMM"),
        'slots' : slots
      });
    });

    return resultDays;
  };

  return {
    daysToObjects : daysToObjects,
    groupDays     : groupDays
  }
})

.factory('PartnerStatus', function() {
  var statusLabels = {'none': "Weitere Partner",
    'premium': "Premium Partner",
    'workshop': "Workshop Partner",
    'flagship': "Flagship Partner",
    'long_tem': "Long Term Partner",
    'friends': "Circle of Friends",
    'supply': "Supply Partner",
    'startup': "StartUp Partner",
  };

  return {
    'statusLabels' : statusLabels,
  }
})

.factory('TopicCategoryService', function($rootScope, Persistence, ContentUpdater) {

  var categoryColors = {};
  var categoryNames = {};
  var englishCategoryNames = {};

  var updater = function() {
    Persistence.listCategories().then(function(categories) {
      categoryColors = {};
      categoryNames = {};
      englishCategoryNames = {};
      angular.forEach(categories, function(category) {
        categoryColors[category.serverId] = '#' + category.color;
        categoryNames[category.serverId] = category.name;
        englishCategoryNames[category.serverId] = category.name_en;
      });
    });
  };

  $rootScope.$watchCollection(function() { return ContentUpdater.topicCategoryUpdateCounter }, function(oldVal, newVal) {
    updater();
  });
  updater();

  return {
    categoryColorFromId : function(categoryId) {
      return categoryColors[categoryId];
    },
    categoryNameFromId : function(categoryId, languageCode) {
      if(languageCode == 'en') {
        return englishCategoryNames[categoryId];
      } else {
        return categoryNames[categoryId];
      }
    }
  }

})

.factory('MafoTimeFormatter', function() {
  return {
    formatTime : function(timestamp) {
      return moment(timestamp).format("HH:mm");
    },
    formatNewsDate : function(timestamp) {
      var time = moment(timestamp, "X");
      return time.format("DD. MMM YYYY, HH");
    }
  }
});
