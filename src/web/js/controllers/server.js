app.controller('serverCtrl', function($scope, $rootScope, $stateParams)
{
  $scope.list = {
    limit : 100,
    servers : [],
    currentServer : null,
    retreiving : false,
    retreive : function(){
      console.log("Retreiving servers list...");
      $rootScope.ipc.emit("retreiveServers",{filters : $scope.filters, limit : this.limit});
    }
  }

  $scope.gamemodes;

  //retreive gamemodes
  $http.get('../../gamemodes.json').then(function(d){
    console.log(d);
  }, function(){
    //error
  });

  //master server query filter
  $scope.filters = {
    "appid" : 440,
    "secure" : true,
    "empty" : false
  };

  $scope.list.retreive();

  //on server list receiving
  $rootScope.ipc.on("serversList", function(data){
    console.log(data[0]);
    $scope.list.servers = data;
    if(!$scope.$$phase) {
      $scope.$apply()
    }
  });

});
