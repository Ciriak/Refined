//connected to tf2 main server

tf2.on("connectedToGC", function(version){
  console.log("Connected to tf2 GC");
  ipc.emit("connectedToGC");
});

//connected to tf2 main server
tf2.on("disconnectedFromGC", function(reason){
  console.log("Disconnected from tf2 GC");
  ipc.emit("disconnectedFromGC");
});

//connected to tf2 main server
tf2.on("backpackLoaded", function(){
  console.log("Backpack loaded");
  ipc.emit("backpackLoaded", tf2.backpack);
});

//when client ask server list
ipc.on('retreiveServers', function (data) {
  //retreive servers list

  var filters = data.filters.join(",");
  console.log(filters);
  client.getServerList(filters, data.limit, function(servers){
    ipc.emit("serversList", servers);
  });
});
