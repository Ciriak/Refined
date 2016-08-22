app.controller('loginCtrl', function($scope, $rootScope, $stateParams, $http)
{
  $scope.login = {
    available : true,
    processing : false,
    error : false,
    sendRequest : function(){
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
    }
    else{
      $scope.login.error = true;
    }
    $scope.login.available = true;
    $scope.login.processing = false;

    if(!$scope.$$phase) {
      $scope.$apply()
    }
  });

});
