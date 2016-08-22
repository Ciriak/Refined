app.controller('loginCtrl', function($scope, $rootScope, $stateParams, $http)
{
  $scope.login = {
    available : false,
    processing : true,
    error : false,
    loginTimeout : {},
    loginRepeat : {},
    sendRequest : function(){
      $rootScope.ipc.emit("login", this);
    }
  }

  checkConnect(); //try to login

  function checkConnect(){
    $rootScope.ipc.emit("checkConnect");
    $scope.login.processing = true;
    if(!$scope.$$phase) {
      $scope.$apply()
    }

    $scope.login.loginTimeout = setTimeout(function(){
      $scope.login.error = true;
      $scope.login.processing = false;
      if(!$scope.$$phase) {
        $scope.$apply()
      }
    },10000);
    $scope.login.loginRepeat = setTimeout(function(){
      checkConnect();
    },20000);
  };

  $rootScope.ipc.on('steamConnected',function() {
    console.log("Steam client connected");
    $scope.login.available = true;
    $scope.login.processing = false;
    $scope.login.error = false;
    clearInterval($scope.login.loginTimeout);
    clearInterval($scope.login.loginRepeat);
    if(!$scope.$$phase) {
      $scope.$apply()
    }
  });

  $rootScope.ipc.on('steamDisconnected',function() {
    console.log("Steam client disconnected");
    $scope.login.available = false;
    checkConnect();
  });

});
