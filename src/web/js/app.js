var app = angular.module('refined', [
'ui.router'
    ]);

app.config(function($stateProvider, $urlRouterProvider) {
  //
  // For any unmatched url, redirect to /
  $urlRouterProvider.otherwise("/");
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
    .state('server', {
      url: "/{fileUrl:.*?}",
      templateUrl: "views/server.html",
      controller: "serverCtrl"
    });
});

app.controller('mainCtrl', ['$scope', '$http', '$rootScope', '$location', '$state', function($scope, $http, $rootScope, $location, $state)
{
  $scope.test = "dd";
}]);
