angular.module('starter.controllers')

.controller('PartnersCtrl', function($scope, $filter, $state, $ionicHistory, DataLanguage, Persistence, ContentUpdater, PartnerStatus) {
  $scope.partners = [];

  $scope.partnerName = 'name';

  var updater = function() {
    Persistence.listPartners().then(function(partners) {
      $scope.platinPartners = $filter('filter')(partners, {'partnerStatus' : 'platin'});
      $scope.goldPartners = $filter('filter')(partners, {'partnerStatus' : 'gold'});
      $scope.silverPartners = $filter('filter')(partners, {'partnerStatus' : 'silver'});
      $scope.bronzePartners = $filter('filter')(partners, {'partnerStatus' : 'bronze'});
      $scope.mediaPartners = $filter('filter')(partners, {'partnerStatus' : 'media'});
      $scope.startupPartners = $filter('filter')(partners, {'partnerStatus' : 'startup'});
      $scope.supplyPartners = $filter('filter')(partners, {'partnerStatus' : 'supply'});

      $scope.otherPartners = $filter('filter')(partners, {'partnerStatus' : 'none'});
    });
  };
  $scope.$watch(function() { return ContentUpdater.partnerUpdateCounter }, function(oldVal, newVal) {
    if(!(oldVal === newVal)) {
      updater();
    }
  });
  updater();

  $scope.$watch(DataLanguage.currentLanguage, function(newVal, oldVal) {
    if(!(oldVal === newVal)) {
      if(newVal == 'en') {
        $ionicHistory.clearHistory();
        $ionicHistory.nextViewOptions({
          disableAnimate: false,
          disableBack: true
        });
        $state.go('app.starter');
      }
    }
  });

  $scope.partnerLabels = PartnerStatus.statusLabels;

})

.controller('PartnerCtrl', function($scope, $stateParams, Persistence) {
  $scope.partner = {};
  $scope.workshopsOfPartner = [];

  Persistence.getPartner($stateParams.partnerId).then(function(partner) {
    $scope.partner = partner;
  });

  Persistence.getWorkshopsOfPartner($stateParams.partnerId).then(function(workshops) {
    $scope.workshopsOfPartner = workshops;
  })
});