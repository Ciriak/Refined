var app = angular.module('refined', [
'ui.router',
'angular-electron'
    ]);

app.config(function($stateProvider, $urlRouterProvider) {
  //
  // For any unmatched url, redirect to /
  $urlRouterProvider.otherwise("/login");
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
  var remote = require('electron').remote;
  $rootScope.ipc = require('electron').ipcRenderer
    //login process
}]);
