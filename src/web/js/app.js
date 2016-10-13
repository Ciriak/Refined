var app = angular.module('refined', [
'ui.router',
'angular-electron',
'ngAnimate',
'mgcrea.ngStrap'
    ]);

app.config(function($stateProvider, $urlRouterProvider) {
  //
  // Now set up the states
  $stateProvider
    .state('main', {
      url: "/main",
      templateUrl: "views/main.html"
    })
    .state('login', {
      url: "/login",
      templateUrl: "views/login.html",
      controller: "loginCtrl"
    })
    .state('main.backpack', {
      url: "/backpack",
      templateUrl: "views/backpack.html",
      controller: "backpackCtrl"
    })
    .state('main.servers', {
      url: "/servers",
      templateUrl: "views/servers/list.html",
      controller: "serverCtrl"
    })
    .state('servers.details', {
      url: "/:address",
      templateUrl: "views/servers/server.html"
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

app.directive('resizable', function () {

    return {
        restrict: 'A',
        scope: {
            callback: '&onResize'
        },
        link: function postLink(scope, elem, attrs) {
            elem.resizable();
            elem.on('resize', function (evt, ui) {
              scope.$apply(function() {
                if (scope.callback) {
                  scope.callback({$evt: evt, $ui: ui });
                }
              })
            });
        }
    };
  });

app.directive('draggable', function() {
  return {
    // A = attribute, E = Element, C = Class and M = HTML Comment
    restrict:'A',
    //The link function is responsible for registering DOM listeners as well as updating the DOM.
    link: function(scope, element, attrs) {
      element.draggable({
      });
    }
  };
});

app.controller('mainCtrl', ['$scope', '$http', '$rootScope', '$location', '$state', function($scope, $http, $rootScope, $location, $state)
{
  $rootScope.refined;  //settings and prefs
  $rootScope.remote = require('electron').remote;
  $rootScope.ipc = $rootScope.remote.ipcMain;
  $rootScope.player; //player infos
  $scope.$state = $state;

  // send a notification to the server that the refined.json file should be updated with the given value
  //for keypath (ex maps.pl_upward.label)
  $rootScope.savePropertie = function(keyPath, newVal){
    $rootScope.ipc.emit("savePropertie", {keyPath : keyPath, newVal : newVal});
  }

  //player logged
  $rootScope.ipc.on("refinedConfigFile", function(refined){
    $rootScope.refined = refined;  //settings and prefs
  });

  $rootScope.ipc.on("loginRequired", function(data){
    console.log("Login req");
    $state.go('login');
  });

  //player logged
  $rootScope.ipc.on("refinedInfos", function(data){
    $rootScope.refined = data.refined;  //retreive and store all settings
    if(data.playerInfos){
      $rootScope.player = data.playerInfos;
      $state.go('main');
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

  $scope.players = {
    loading : true,
    count : 0,
    error :false
  }

  retreivePlayersCount();

  function retreivePlayersCount(){
    $scope.players.loading = true;
    $http({
      method: 'GET',
      url: 'https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=440'
    }).then(function successCallback(r) {
      $scope.players.loading = false;
      $scope.players.error = false;
      $scope.players.count = r.data.response.player_count;
    }, function errorCallback(r) {
      $scope.players.loading = false;
      $scope.players.error = true;
      $scope.players.count = 0;
    });
  }

}]);
