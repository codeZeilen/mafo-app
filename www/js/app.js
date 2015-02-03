// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

  .state('app', {
    url: "/app",
    abstract: true,
    templateUrl: "templates/menu.html",
    controller: 'AppCtrl'
  })


    /*
    Personal states
     */
    .state('app.planner', {
      url: "/planner",
      views: {
        'menuContent': {
          templateUrl: 'templates/personal/planner.html',
          controller: 'PlannerCtrl'
        }
      }
    })

    .state('app.news', {
      url: "/news",
      views: {
        'menuContent': {
          templateUrl: 'templates/personal/news.html',
          controller: 'NewsCtrl'
        }
      }
    })

    .state('app.contact', {
      url: "/contact",
      views: {
        'menuContent': {
          templateUrl: 'templates/personal/contact.html',
          controller: 'ContactCtrl'
        }
      }
    })

    /*
    Program states
     */
    .state('app.program', {
      url: "/program",
      views: {
        'menuContent': {
          templateUrl: "templates/program/program.html",
          controller: 'ProgramCtrl'
        }
      }
    })

    .state('app.speakers', {
      url: "/speakers",
      views: {
        'menuContent': {
          templateUrl: "templates/program/speakers.html",
          controller: 'SpeakersCtrl'
        }
      }
    })

    .state('app.partner', {
      url: "/partner",
      views: {
        'menuContent': {
          templateUrl: "templates/program/partner.html",
          controller: 'PartnerCtrl'
        }
      }
    })

    .state('app.map', {
      url: "/map",
      views: {
        'menuContent': {
          templateUrl: "templates/program/map.html",
          controller: 'MapCtrl'
        }
      }
    })

    .state('app.faq', {
      url: "/faq",
      views: {
        'menuContent': {
          templateUrl: "templates/program/faq.html"
        }
      }
    })

    .state('app.info', {
      url: "/info",
      views: {
        'menuContent': {
          templateUrl: "templates/program/info.html"
        }
      }
    })






  .state('app.search', {
    url: "/search",
    views: {
      'menuContent': {
        templateUrl: "templates/search.html"
      }
    }
  })

  .state('app.browse', {
    url: "/browse",
    views: {
      'menuContent': {
        templateUrl: "templates/browse.html"
      }
    }
  })

    .state('app.playlists', {
      url: "/playlists",
      views: {
        'menuContent': {
          templateUrl: "templates/playlists.html",
          controller: 'PlaylistsCtrl'
        }
      }
    })

  .state('app.single', {
    url: "/playlists/:playlistId",
    views: {
      'menuContent': {
        templateUrl: "templates/playlist.html",
        controller: 'PlaylistCtrl'
      }
    }
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/playlists');
});
