app.controller('loginCtrl', function($scope, $rootScope, $stateParams, $http, $state)
{
  $scope.login = {
    available : true,
    processing : false,
    steamGuard : false,
    steamGuardMail : null,
    steamGuardCode : null,
    account : "",
    password : "",
    error : false,
    sendLogin : function(){
      if(!this.available){
        return
      }
      this.processing = true;
      this.available = false;
      $rootScope.ipc.emit("login", this);
    },
    sendAuthenticator : function(){
      if(!this.available){
        return
      }
      this.processing = true;
      this.available = false;
      $rootScope.ipc.emit("steamGuardCodeResponse", this.steamGuardCode);
    }
  }

  $rootScope.ipc.on('steamGuardCodeRequest', function(domain) {   //steamGuard required
    $scope.login.steamGuard = true;
    $scope.login.available = true;
    this.processing = false;
    $scope.login.steamGuardMail = domain;
    if(!$scope.$$phase) {
      $scope.$apply()
    }
  });

  $rootScope.ipc.on('connect',function(r) {
    if(r.success){
      console.log("Connected successfully");
      $scope.login.error = false;

      //retreive player infos

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
