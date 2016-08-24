var app = angular.module('refined', [
'ui.router',
'angular-electron'
    ]);

app.config(function($stateProvider, $urlRouterProvider) {
  //
  // For any unmatched url, redirect to /
  $urlRouterProvider.otherwise("/main");
  //
  // Now set up the states
  $stateProvider
    .state('main', {
      url: "/",
      templateUrl: "views/main.html"
    })
    .state('login', {
      url: "/login",
      templateUrl: "views/login.html",
      controller: "loginCtrl"
    })
    .state('backpack', {
      url: "/backpack",
      templateUrl: "views/backpack.html",
      controller: "backpackCtrl"
    })
    .state('servers', {
      url: "/servers",
      templateUrl: "views/servers.html",
      controller: "serverCtrl"
    });
});

app.directive('errSrc', function() {
  return {
    link: function(scope, element, attrs) {
      scope.$watch(function() {
          return attrs['ngSrc'];
        }, function (value) {
          if (!value) {
            element.attr('src', attrs.errSrc);
          }
      });

      element.bind('error', function() {
        element.attr('src', attrs.errSrc);
      });
    }
  }
});

app.controller('mainCtrl', ['$scope', '$http', '$rootScope', '$location', '$state', function($scope, $http, $rootScope, $location, $state)
{
  $rootScope.refined;  //settings and prefs
  $rootScope.remote = require('electron').remote;
  $rootScope.ipc = $rootScope.remote.ipcMain;
  $rootScope.player; //player infos

  $rootScope.ipc.emit("requestRefinedInfos");

  //player logged
  $rootScope.ipc.on("refinedConfigFile", function(refined){
    $rootScope.refined = refined;  //settings and prefs
  });

  //player logged
  $rootScope.ipc.on("refinedInfos", function(data){
    $rootScope.refined = data.refined;  //retreive and store all settings
    if(data.player){
      $rootScope.player = player;
      $state.go('main');
    }
    else{
      $rootScope.player = {};
      $state.go('login');
    }
  });

  $rootScope.ipc.on("backpackLoaded", function(backpack){
    $rootScope.player.backpack = backpack;
    if(!$scope.$$phase) {
      $scope.$apply()
    }
  });

  $rootScope.ipc.on("itemSchemaLoaded", function(data){
    console.log(data);
  });

  $rootScope.ipc.on("itemSchema", function(itemschema){
    console.log(itemschema);
  });

}]);
