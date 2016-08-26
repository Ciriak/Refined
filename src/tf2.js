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
  //console.log(tf2.itemSchema)
});

tf2.on("itemSchemaLoaded", function(){
  console.log("Item shema loaded");
  ipc.emit("itemSchema", tf2.itemSchema);
});

tf2.on("itemSchemaError", function(err){
  console.log(err);
});

tf2.on("itemSchema", function(version, itemsGameUrl){
  console.log("Item shema received");
  reloadItemSchema(version, itemsGameUrl);
});

function reloadItemSchema(version, itemsGameUrl){
  console.log("Receiving itemschema v."+version);
  console.log(itemsGameUrl);
}

//when client ask server list
ipc.on('retreiveServers', function (data) {
  //retreive servers list
  var filters = "";
  var nand = null;
  if(data.filters.nand){
    nand = data.filters.nand;
  }
  for (var prop in data.filters) {
    if (data.filters.hasOwnProperty(prop) && prop !== "nand") {
      var val = data.filters[prop];
      filters = filters+formatFilter(prop, val);
    }
  }

  //check the nand props
  if(nand !== null){
    for (var prop in nand) {
      if (nand.hasOwnProperty(prop)) {
        var val = nand[prop];
        filters = filters+"\\nand"+formatFilter(prop, val);
      }
    }
  }

  console.log(filters);
  client.getServerList(filters, data.limit, function(servers){
    ipc.emit("serversList", servers);
  });
});


function formatFilter(prop, val){
  return "\\"+prop+"\\"+val.toString().replace("true", "1").replace("false", "0");
}
