angular.module('starter.services')

.factory('PlannerContent', function(Persistence, $timeout, $ionicPopup) {

  var minutesPerSlot = 15;
  var startHour = 7;
  var endHour = 24;

  var fixedEvents = [
    {
      'name': 'Check-In im Fuchs-Petrolub Festsaal',
      'roomId': 4,
      'startTime': moment('03-10-2016 16:00', 'MM-DD-YYYY HH:mm'),
      'endTime':   moment('03-10-2016 20:00', 'MM-DD-YYYY HH:mm'),
      'durationInMinutes' : 30,
      'isFixedEvent' : true
    },
    {
      'name': 'Check-In in O048',
      'roomId': 3,
      'startTime': moment('03-11-2016 07:00', 'MM-DD-YYYY HH:mm'),
      'endTime':   moment('03-11-2016 11:00', 'MM-DD-YYYY HH:mm'),
      'durationInMinutes' : 30,
      'isFixedEvent' : true
    },
    {
      'name': 'Check-In for Internationals in O048',
      'roomId': 3,
      'startTime': moment('03-12-2016 08:00', 'MM-DD-YYYY HH:mm'),
      'endTime':   moment('03-12-2016 11:00', 'MM-DD-YYYY HH:mm'),
      'durationInMinutes' : 30,
      'isFixedEvent' : true
    },
  ];

  var alarms = {};
  var setAlarm = function(event) {
    if(!angular.isDefined(event.startTime)) {
      return false;
    }
    var reminderStart = moment(event.startTime);
    reminderStart.subtract(moment.duration(10, 'minutes'));

    if(reminderStart > moment() && !angular.isDefined(alarms[event.serverId])) {
      console.log("set alarm");
      var delayMs = reminderStart.diff(moment());
      delayMs = Math.min(delayMs, 2147483647); // Prevents an overflow in $timeout
      var popupShown = false;
      alarms[event.serverId] = $timeout(function() {
            if(!popupShown) {
              popupShown = true;
              var alertPopup = $ionicPopup.alert({
                title: 'Erinnerung',
                template: 'Die Veranstaltung ' + event.name + ' beginnt in 10 Minuten.'
              });
              alertPopup.then(function(res) {});
            }
          },
          delayMs);
    }
  };
  var cancelAlarm = function(event) {
    if(angular.isDefined(alarms[event.serverId])) {
      $timeout.cancel(alarms[event.serverId]);
    }
  };

  var allEvents = [];

  var favoriteEvents = [];
  Persistence.listFavoriteEvents().then(function(persistedFavoriteEvents) {
    favoriteEvents = persistedFavoriteEvents;
    angular.forEach(persistedFavoriteEvents, setAlarm);
    allEvents = allEvents.concat(persistedFavoriteEvents);
  });

  var userEvents = [];
  Persistence.listUserEvents().then(function(persistedUserEvents) {
    userEvents = persistedUserEvents;
    allEvents = allEvents.concat(persistedUserEvents);
  });

  var isFavorite = function(event) {
    return favoriteEvents.indexOf(event) > -1;
  };

  return {
    getAllEvents : function() { return allEvents },
    getFavoriteEvents : function() { return favoriteEvents },
    isFavoriteEvent : isFavorite,
    favoriteEvent : function(event) {
      allEvents.push(event);
      favoriteEvents.push(event);
      setAlarm(event);
      Persistence.addFavoriteEvent(event.serverId);
    },
    removeFavoriteEvent : function(event) {
      var index = favoriteEvents.indexOf(event);
      if(index > -1) {
        favoriteEvents.splice(index, 1);
      }
      index = allEvents.indexOf(event);
      if(index > -1) {
        allEvents.splice(index, 1);
      }
      cancelAlarm(event);
      Persistence.removeFavoriteEvent(event.serverId);
    },
    getUserEvents : function() { return userEvents },
    saveUserEvent : function(eventData) {
      Persistence.addUserEvent(eventData).then(function(persistedUserEvent) {
        userEvents.push(persistedUserEvent);
        allEvents.push(persistedUserEvent);
      });
    },
    removeUserEvent : function(event) {
      var index = userEvents.indexOf(event);
      if(index > -1) {
        userEvents.splice(index, 1);
      }
      index = allEvents.indexOf(event);
      if(index > -1) {
        allEvents.splice(index, 1);
      }
      Persistence.removeUserEvent(event);
    },
    slotsForDay : function(day) {
      var startDay = moment(day);
      var endOfDay = moment(startDay);
      endOfDay.add(moment.duration(1, 'days'));

      var dayEvents = [];
      angular.forEach(favoriteEvents.concat(fixedEvents).concat(userEvents), function(event) {
        if (moment(event.startTime).isBetween(startDay, endOfDay)) {
          dayEvents.push(event);
        }
      });

      var daySlots = [];
      for (var i = 0; i < (endHour - startHour) * (60 / minutesPerSlot); i++) {
        var time = moment(startDay);
        time.add(moment.duration(startHour, 'hours'));
        time.add(moment.duration(i * minutesPerSlot, 'minutes'));

        // Filter events in between
        var events = [];
        var endTime = moment(time);
        endTime.add(moment.duration(minutesPerSlot, 'minutes'));
        var startTime = moment(time);
        startTime.subtract(moment.duration(1, 'minutes'));
        angular.forEach(dayEvents, function (event) {
          if (moment(event.startTime).isBetween(startTime, endTime)) {
            var offset = moment(event.startTime);
            offset.subtract(startTime);
            event['offset'] = moment.duration(offset.hours() * 60 + offset.minutes(), 'minutes');

            event['timeString'] = moment(event.startTime).format("HH:mm").concat(" - ").concat(moment(event.endTime).format("HH:mm"));
            events.push(event);
          }
        });

        daySlots.push({
          timestamp: time,
          timeString: time.format("HH:mm"),
          events: events
        });
      }

      return daySlots;
    }

  }
});

