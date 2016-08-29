app.controller('serverCtrl', function($scope, $rootScope, $stateParams)
{
  $scope.currentView = "list";
  $scope.list = {
    max : $rootScope.refined.servers.max,
    expected : $rootScope.refined.servers.max - 1,
    perMore : $rootScope.refined.servers.perMore,
    order : {
      propertyName : 'name',
      reverse : false
    },
    servers : [],
    gameModes : [],
    currentServer : null,
    retreiving : false,
    shouldRetreive : true,
    retreiveTimeout : null,
    retreive : function(){

      //reset the timeout if query is called manually
      clearTimeout(this.retreiveTimeout);
      this.shouldRetreive = true;

      //stop if we have enough servers
      if(this.servers.length >= this.max){
        this.retreiving = false;
        if(!$scope.$$phase) {
          $scope.$apply();
        }
        return;
      }

      //send the query to the MS
      this.retreiving = true;
      console.log("Retreiving servers list...");
      $rootScope.ipc.emit("retreiveServers",{filters : $scope.filters, limit : this.expected});

      retreiveTimeout = setTimeout(function(){
        $scope.list.retreiving = false;
        $scope.list.shouldRetreive = false;
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

  //master server query filter
  $scope.filters = {
    "appid": 440,
    "secure": true,
    "empty": false,
    "tags": {
      "exclude": [
        "valve"
      ]
    }
  };

  $scope.toggleGameModeFromFilter = function(gameModeName){
    var gameMode = $scope.refined.gameModes[gameModeName];
    //if not exclude -> exclude
    var toggleValue = false;
    if(!gameMode.exclude){
      toggleValue = true;
    }
    gameMode.exclude = toggleValue;
      // find the maps associed to this gamemode
    for (var map in $scope.refined.maps) {
      if ($scope.refined.maps.hasOwnProperty(map)) {
        if($scope.refined.maps[map].gameMode === gameModeName){
          //set the value
          $scope.refined.maps[map].exclude = toggleValue;
          var t = $scope.filters.tags.exclude;
          if(toggleValue){
            t.push(map);
          }
          else{
            t = _.remove(t, function(n) {
              return n === map;
            });
          }
        }
      }
    }

    // if exclude -> unexclude


    if(!$scope.$$phase) {
      $scope.$apply();
    }
  };

  $scope.toggleMapFromFilter = function(mapName){
    if(!$scope.refined.maps[mapName]){
      return;
    }
    var toggleValue = false;
    if(!$scope.refined.maps[mapName].exclude){
      toggleValue = true;
    }
    $scope.refined.maps[mapName].exclude = toggleValue;
    console.log('Toggling '+mapName);

    //if the gameMode as been disabled, re-enable it
    if(toggleValue === false){
      var gm = $scope.refined.maps[mapName].gameMode;
      $scope.refined.gameModes[gm].exclude = false;
    }

    var t = $scope.filters.tags.exclude;
    if(toggleValue){
      t.push(map);
    }
    else{
      t = _.remove(t, function(n) {
        return n === map;
      });
    }

    if(!$scope.$$phase) {
      $scope.$apply();
    }
  };

  $scope.setCurrentGameMode = function(gameMode){
    $scope.currentGameMode = gameMode;
    if(!$scope.$$phase) {
      $scope.$apply();
    }
  }

  $scope.list.retreive();

  /*
    When receiving news servers
    check if already in the list
    then check if we should add it on the list (based on some filters)
    while number of servers < expected servers resend a query
  */
  $rootScope.ipc.on("serversList", function(data){
    $scope.retreiving = false;
    for (var i = 0; i < data.length; i++) {
      if($scope.list.servers.length < $scope.list.max){
        $scope.list.expected++;
        $scope.list.servers.push(data[i]);
      }
      else{
        $scope.list.retreiving = false;
      }
    }

    if(!$scope.$$phase) {
      $scope.$apply();
    }

    if($scope.list.servers.length < $scope.list.expected){
      var remaining = $scope.list.expected - $scope.list.servers.length;
      setTimeout(function(){
        $scope.list.expected += remaining;
        if($scope.list.shouldRetreive){
          $scope.list.retreive();
        }
      },1000);

    }

    if(!$scope.$$phase) {
      $scope.$apply();
    }
  });

});
