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
  console.log("Retreiving servers...");
  //retreive servers list
  var filters = "";
  var customFilters = null;
  if(data.filters.tags){
    customFilters = data.filters.tags;
  }
  for (var prop in data.filters) {
    if (data.filters.hasOwnProperty(prop) && prop !== "tags") {
      var val = data.filters[prop];
      filters = filters+formatFilter(prop, val);
    }
  }



  client.getServerList(filters, data.limit, function(servers){
    console.log(servers.length+" server(s) found, filtering...");
    var newServers = [];
    for (var i = 0; i < servers.length; i++) {
      //Ignore the server if already known
      if(_.findIndex(knownServers, { 'name' : servers[i].name }) === -1){

        //check the tags of the server
        if(checkCustomFilters(servers[i].gametype, customFilters)){

          //insert additionnals informations and add the server to the new list
          servers[i].mapName = getMapName(servers[i].map);
          servers[i].gameMode = getGameModeName(servers[i].map);
          newServers.push(servers[i]);

        }
      }
    }

    console.log(newServers.length+" new server(s) send");
    //check if server is known
    ipc.emit("serversList", newServers);
  });
});

function checkCustomFilters(tags, customFilter){
  //create empty tags if needed (prevent error)
  if(!tags){
    tags = "";
  }
  var tagsList = tags.split(",");
  for (var i = 0; i < tagsList.length; i++) {
    var fi = _.indexOf(customFilter.exclude, tagsList[i]);
    if(fi !== -1){
      return false;
    }
  }
  return true;
}

function getMapName(map){
  if(!map){   //stop if map name not provided
    return false;
  }
  if(refined.maps[map]){
    if(refined.maps[map].label){
      return refined.maps[map].label;  //return map custom label if exist
    }
  }
  return map;   //return normal label (ex ctf_xxx)
}

function getGameModeName(map, isShort){
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
    if(refined.maps[map]){
      if(refined.maps[map].gameMode){  //if specific gamemode exist for this map
        return refined.maps[map].gameMode;
      }
    }
    for (var gm in refined.gameModes) {
      if (refined.gameModes.hasOwnProperty(gm)) {
        var r = _.indexOf(refined.gameModes[gm], short);
        if(r > -1){
          return gm;
        }
      }
    }
    return "Unknow Gamemode";
  }
}

function formatFilter(prop, val){
  return "\\"+prop+"\\"+val.toString().replace("true", "1").replace("false", "0");
}
