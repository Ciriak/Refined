app.controller('navCtrl', function($scope, $rootScope, $stateParams, $http)
{
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

});
