app.controller('serverCtrl', function($scope, $rootScope, $stateParams)
{
  $scope.list = {
    filters : ["\\appid\\440"],
    limit : 100,
    servers : [],
    retreiving : false,
    retreive : function(){
      console.log("Retreiving servers list...");
      $rootScope.ipc.emit("retreiveServers",{filters : this.filters, limit : this.limit});
    }
  }

  $scope.list.retreive();


  //on server list receiving
  $rootScope.ipc.on("serversList", function(data){
    console.log(data[0]);
    $scope.list.servers = data;
  });

});
