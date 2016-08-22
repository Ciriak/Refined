app.controller('loginCtrl', function($scope, $rootScope, $stateParams, $http, $state)
{
  $scope.login = {
    available : true,
    processing : false,
    steamGuard : false,
    error : false,
    sendRequest : function(){
      if(!this.available){
        return
      }
      this.processing = true;
      this.available = false;
      $rootScope.ipc.emit("login", this);
    }
  }

  $rootScope.ipc.on('connect',function(r) {
    console.log(r);
    if(r.success){
      console.log("Connected successfully");
      $scope.login.error = false;
      $state.go('main');
    }
    else{
      if(r.data.eresult === 85){  //ask Steam Guard
        $scope.login.steamGuard = true;
      }
      else{                 //just login error
        $scope.login.error = true;
      }

    }

    $scope.login.available = true;
    $scope.login.processing = false;
    if(!$scope.$$phase) {
      $scope.$apply()
    }
  });

});
