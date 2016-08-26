app.controller('serverCtrl', function($scope, $rootScope, $stateParams)
{
  $scope.list = {
    max : $rootScope.refined.servers.max,
    expected : $rootScope.refined.servers.max - 1,
    perMore : $rootScope.refined.servers.perMore,
    order : {
      propertyName : 'name',
      reverse : false
    },
    servers : [],
    currentServer : null,
    retreiving : false,
    retreive : function(){
      if(this.servers.length >= this.max){
        this.retreiving = false;
        if(!$scope.$$phase) {
          $scope.$apply();
        }
        return;
      }
      this.retreiving = true;
      console.log("Retreiving servers list...");
      $rootScope.ipc.emit("retreiveServers",{filters : $scope.filters, limit : this.expected});
      setTimeout(function(){
        $scope.list.retreiving = false;
        if(!$scope.$$phase) {
          $scope.$apply();
        }
      }, 5000);
    },
    reset : function(){
      this.servers = [];
      this.max = $rootScope.refined.servers.max;
      this.expected = $rootScope.refined.servers.max - 1;
      this.retreive();
    },
    retreiveMore : function(){
      this.max += this.perMore;
      this.expected = this.max;
      this.retreive();
    },
    sortBy : function(propertyName){
      this.order.reverse = (this.order.propertyName === propertyName) ? !this.order.reverse : false;
      this.order.propertyName = propertyName;
    }
  };

  $scope.getGamemodeName = function(map, isShort){
    if(!map){   //stop if map name not provided
      return false;
    }
    var short;
    short = map.split("_");
    short = short[0];
    if(isShort){        //if shortName asked return it and stop
      return short;
    }
    else{             //gamemode override by map name (ex mediaval for cp_degrootkeep)
      if($rootScope.refined.maps[map]){
        if($rootScope.refined.maps[map].gameMode){  //if specific gamemode exist for this map
          return $rootScope.refined.maps[map].gameMode;
        }
      }
      var r = $rootScope.refined.gameModes[short];
      if(!r){
        return "Unknow Gamemode";
      }
      return $rootScope.refined.gameModes[short];
    }
  };

  $scope.getMapName = function(map){
    if(!map){   //stop if map name not provided
      return false;
    }
    if($rootScope.refined.maps[map]){
      if($rootScope.refined.maps[map].label){
        return $rootScope.refined.maps[map].label;  //return map custom label if exist
      }
    }
    return map;   //return normal label (ex ctf_xxx)
  };

  //master server query filter
  $scope.filters = {
    "appid" : 440,
    "secure" : true,
    "empty" : false
  };

  $scope.list.retreive();

  /*
    When receiving news servers
    check if already in the list
    while number of servers < expected servers resend a query
  */
  $rootScope.ipc.on("serversList", function(data){
    $scope.retreiving = false;
    for (var i = 0; i < data.length; i++) {
      var fi = _.findIndex($scope.list.servers, { 'name' : data[i].name });
      if(fi === -1 && $scope.list.servers.length < $scope.list.max){
        $scope.list.servers.push(data[i]);
      }
      else{
        $scope.list.retreiving = false;
        if(!$scope.$$phase) {
          $scope.$apply();
        }
      }
    }

    if($scope.list.servers.length < $scope.list.expected){
      var remaining = $scope.list.expected - $scope.list.servers.length;
      setTimeout(function(){
        $scope.list.expected += remaining;
        $scope.list.retreive();
      },1000);

    }

    if(!$scope.$$phase) {
      $scope.$apply();
    }
  });

});
