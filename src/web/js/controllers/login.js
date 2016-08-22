app.controller('loginCtrl', function($scope, $rootScope, $stateParams, $http)
{
  checkConnect();
  $scope.login = {
    available : false,
    processing : true,
    request : function(){
      $rootScope.ipc.emit("login")
    }
  }

  function checkConnect(){
    $rootScope.ipc.send("checkConnect");
  };

  $rootScope.ipc.on('steamConnected',function() {
    console.log("Steam client connected");
    $scope.login.available = true;
  });

});
