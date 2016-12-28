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

ipc.on('retreiveConfigFile', function(event, data){
  event.returnValue = refined;
});

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

  console.log(customFilters);

  client.getServerList(filters, data.limit, function(servers){
    console.log(servers.length+" server(s) found, filtering...");
    var newServers = [];
    for (var i = 0; i < servers.length; i++) {
      //Ignore the server if already known
      if(_.findIndex(knownServers, { 'name' : servers[i].name }) === -1){

        //check the tags of the server
        if(checkCustomFilters(servers[i], customFilters)){

          //insert additionnals informations and add the server to the new list
          servers[i].map = getMap(servers[i].map);
          servers[i].gameMode = getGameMode(servers[i].map.fileName);
          newServers.push(servers[i]);
        }
      }
    }

    console.log(newServers.length+" new server(s) send");
    //check if server is known
    ipc.emit("serversList", newServers);
  });
});

ipc.on("launchGame", function(options){
  var cmd = '"'+refined.steam.exeLocation+'" -login '+refined.steamAuth.accountName+' '+refined.steamAuth.loginKey+' -applaunch 440 -windowed -height 1366 -width 768 -novid +connect '+options.addr;

  exec(cmd, function(error, stdout, stderr) {
    console.log(cmd);
    console.log(stdout);
    console.log(stderr);
    if(error){
      console.log(error);
    }
  });
});

function checkCustomFilters(server, customFilter){
  //create empty tags if needed (prevent error)
  if(!server.gametype){
    server.gametype = "";
  }
  var tagsList = server.gametype.split(",");
  for (var i = 0; i < tagsList.length; i++) {
    // check if server tags are in exclude list
    var fi = _.indexOf(customFilter.exclude, tagsList[i]);
    if(fi !== -1){
      return false;
    }
    // check if server map is in exclude list
    fi = _.indexOf(customFilter.exclude, server.map);
    if(fi !== -1){
      return false;
    }
  }
  return true;
}

function getMap(map){
  if(!map){   //stop if map name not provided
    return false;
  }

  //if this map exist, we
  if(refined.maps[map]){
    // attach the gamemode not specified
    if(!refined.maps[map].gameMode){
      refined.maps[map].gameMode = getGameMode(map.fileName);
    }

    //Label = mapName if no defined (ctf_2fort)
    if(!refined.maps[map].label){
      refined.maps[map].label = map;
    }
  }
  else{
    saveNewMap(map);
  }
  return refined.maps[map];   //return normal label (ex ctf_xxx)
}

// getGameMode("cp_degrootkeep", true)
function getGameMode(mapName, isShort){

  if(typeof(mapName) !== "string"){   //stop if map name not provided
    return 'unknown';
  }
  var short;
  short = mapName.split("_");
  short = short[0];
  if(isShort){        //if shortName asked return it and stop
    return short;
  }
  else{             //gamemode override by map name (ex Medieval for cp_degrootkeep)
    if(refined.maps[mapName]){
      if(refined.maps[mapName].gameMode && refined.maps[mapName].gameMode !== "unknown"){  //if specific gamemode exist for this map
        return refined.maps[mapName].gameMode;
      }
    }
    for (var gameMode in refined.gameModes) {
      if (refined.gameModes.hasOwnProperty(gameMode)) {
        var r = _.indexOf(refined.gameModes[gameMode].tags, short);
        if(r > -1){
          return gameMode;
        }
      }
    }
    return 'unknown';
  }
}

// save a new discovered map with the map template
function saveNewMap(mapName){
  var gm = getGameMode(mapName);
  refined.maps[mapName] = {
    "fileName": mapName,
    "label": mapName,
    "gameMode": gm,
    "exclude":  false,
    "official": false
  };
  // save this new map
  savePropertie("maps."+mapName, refined.maps[mapName]);
}

function formatFilter(prop, val){
  return "\\"+prop+"\\"+val.toString().replace("true", "1").replace("false", "0");
}
