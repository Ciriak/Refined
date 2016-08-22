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
    .state('list', {
      url: "/list",
      templateUrl: "views/list.html"
    })
    .state('login', {
      url: "/login",
      templateUrl: "views/login.html",
      controller: "loginCtrl"
    })
    .state('server', {
      url: "/{fileUrl:.*?}",
      templateUrl: "views/server.html",
      controller: "serverCtrl"
    });
});

app.controller('mainCtrl', ['$scope', '$http', '$rootScope', '$location', '$state', function($scope, $http, $rootScope, $location, $state)
{
  $rootScope.remote = require('electron').remote;
  $rootScope.ipc = $rootScope.remote.ipcMain;
  $rootScope.player = {};

  $rootScope.ipc.emit("requestPlayerInfos");

  $rootScope.ipc.on("playerInfos", function(player){
    if(player){
      $rootScope.player = player;
      $state.go('main');
    }
    else{
      $rootScope.player = {};
      $state.go('login');
    }
  });

}]);
