app.controller('backpackCtrl', function($scope, $rootScope, $stateParams, $http, $state)
{
  console.log($rootScope.player.backpack);
  console.log($rootScope.player.backpack[0])
});
