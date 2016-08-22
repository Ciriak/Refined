app.controller('loginCtrl', function($scope, $rootScope, $stateParams, $http)
{
  $scope.login = {
    available : false,
    processing : true,
    error : false,
    loginTimeout : {},
    request : function(){
      $rootScope.ipc.emit("login")
    }
  }

  checkConnect(); //try to login

  function checkConnect(){
    $rootScope.ipc.send("checkConnect");
    $scope.login.processing = true;
    if(!$scope.$$phase) {
      $scope.$apply()
    }

    setTimeout(function(){
      $scope.login.error = true;
      $scope.login.processing = false;
      if(!$scope.$$phase) {
        $scope.$apply()
      }
    },10000);
    $scope.login.loginTimeout = setTimeout(function(){
      checkConnect();
    },20000);
  };

  $rootScope.ipc.on('steamConnected',function() {
    console.log("Steam client connected");
    $scope.login.available = true;
    $scope.login.processing = false;
    $scope.login.error = false;
    clearInterval($scope.login.loginTimeout);
    if(!$scope.$$phase) {
      $scope.$apply()
    }
  });

});
