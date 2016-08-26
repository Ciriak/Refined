const electron = require('electron');
const {app} = require('electron');
const Menu = electron.Menu;
const BrowserWindow = electron.BrowserWindow;
const GhReleases = require('electron-gh-releases');
const commandLineArgs = require('command-line-args');
const ipc = electron.ipcMain;
const ChildProcess = require('child_process');
const path = require('path');
const appFolder = path.resolve(process.execPath, '..');
const rootAtomFolder = path.resolve(appFolder, '..');
var refined = require(__dirname+'/refined_default.json');
var playerInfos;
var jsonfile = require('jsonfile');
var Steam = require('steam');
var SteamUser = require('steam-user');
var client = new SteamUser({
  promptSteamGuardCode:false
});
var TeamFortress2 = require('tf2');
var tf2 = new TeamFortress2(client);
const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
const exeName = "refined.exe";
let splashScreen
let mainWindow
//retreive package.json properties
var pjson = require('./package.json');

var fs = require('fs-extra');

console.log("Refined V."+pjson.version);

configFileChecker();    // manage the config file

singleInstanceChecker();  // for single instance

app.on('window-all-closed', function () {

  client.gamesPlayed([]); //exit steam app

  if (process.platform !== 'darwin') {
    app.quit()
  }
});



app.on('ready', () => {
  mainWindow = new BrowserWindow({
    show:false,
    width: 1024,
    height: 600,
    minWidth: 1024,
    icon: __dirname + '/web/img/tgf/icon_circle.png'
  });
  mainWindow.loadURL(`file://${__dirname}/web/index.html`);
  //display the main app and close the
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();

    autoConnectChecker(); //autoconnect the user if some ID are stored

  });
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (splashScreen === null) {
    createWindow();
  }
});

//the user ask for login
var sData;
var loginTimeout;
ipc.on('login', function (data) {

  //sentry check
  var sentry = undefined;
  if(fs.existsSync('./sentry')){
    console.log("Sentry file exist !");
    sentry = fs.readFileSync('./sentry');
  }

  //accountlogin

  client.logOn({
    accountName: data.account,
    password: data.password,
    twoFactorCode: data.two_factor_code,
    rememberPassword : true
  });

  //save the last entered account name
  savePropertie("steamAuth.accountName", data.account);
});

//hook the "save propertie" client calls
ipc.on("savePropertie", function(data){
  savePropertie(data.keyPath, data.newVal);
});

//save a propertie to refined.json
//key path is the path of the target (ex maps.pl_upward.label)
function savePropertie(keyPath, newVal){
  assign(refined, keyPath, newVal);
  //write the new data in the json file
  jsonfile.writeFileSync(__dirname+'/refined.json', refined, {spaces: 2});

  console.log("Value of "+keyPath+" is now "+newVal);

  //notify the client that the refined file has been updated
  ipc.emit("refinedInfos", {refined : refined, playerInfos : client});
}

// from http://stackoverflow.com/questions/13719593/how-to-set-object-property-of-object-property-of-given-its-string-name-in-ja
//used to assign object properties by path in string
function assign(obj, prop, value) {
    if (typeof prop === "string")
        prop = prop.split(".");

    if (prop.length > 1) {
        var e = prop.shift();
        assign(obj[e] =
                 Object.prototype.toString.call(obj[e]) === "[object Object]"
                 ? obj[e]
                 : {},
               prop,
               value);
    } else
        obj[prop[0]] = value;
}

client.on('loggedOn', function(details) {
  console.log(details);
  console.log("Logged into Steam as " + client.steamID.getSteam3RenderedID());
	client.setPersona(SteamUser.EPersonaState.Online);
	client.gamesPlayed(440);
  ipc.emit("refinedInfos", {refined : refined, playerInfos : details});
});

client.on('loginKey', function(key){
  savePropertie('steamAuth.loginKey', key);
});

client.on('error', function(e) {
	// Some error occurred during logon
  console.log("Error, login required");
  ipc.emit("loginRequired",e);
});

client.on('steamGuard', function(domain, callback) {

  console.log("Sending a steam guard query");

  ipc.emit('steamGuardCodeRequest', domain);  //Ask the steam guard code

  ipc.on('steamGuardCodeResponse', function (code) {    //work with the response
    callback(code);
  });
});

client.on('updateMachineAuth', function(buffer){
  console.log("newSentry");
    var newsentry = './sentry';
    fs.writeFileSync(newsentry, buffer.bytes);
});

//include tf2 listener
eval(fs.readFileSync(__dirname+'/tf2.js')+'');

//
// Create the splashscreen
//
// Also check for update -> Pre-render the app -> show the app

function autoConnectChecker(){
  if(refined.steamAuth.loginKey && refined.steamAuth.accountName){
    client.logOn({
      accountName: refined.steamAuth.accountName,
      loginKey: refined.steamAuth.loginKey
    });
  }
  else{
    ipc.emit("loginRequired");
  }
};

function configFileChecker() {  //check if the config file exist and create it if needed
  var path = __dirname+'/refined.json';
  fs.exists(path, function(exists) {
    if (exists) {
        refined = require(path);
    }
    else{
      //use the refined_default.json as model
      fs.copy(__dirname+'/refined_default.json', path, function (err) {
        if (err) return console.error(err)
        refined = require(path);
      });
    }
  });
}

function singleInstanceChecker(){
  //check if another instance exist
  // if exist, send it the command line arguments and focus the window
  const shouldQuit = app.makeSingleInstance((args, workingDirectory) => {
    var parsedArgs = commandLineArgs(optionDefinitions, args);
    checkArgsOptions(parsedArgs);
    if (mainWindow) {
      if (mainWindow.isMinimized()){
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });

  if (shouldQuit) {
    app.quit();
    return;
  }
}
