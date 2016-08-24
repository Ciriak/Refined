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


// Hook the squirrel update events
if (handleSquirrelEvent()) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  return;
}

function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false;
  }

  const spawn = function(command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
    } catch (error) {}

    return spawnedProcess;
  };

  const spawnUpdate = function(args) {
    return spawn(updateDotExe, args);
  };

  const squirrelEvent = process.argv[1];

  var exePath = app.getPath("exe");
  var lnkPath = ["%APPDATA%/Microsoft/Windows/Start Menu/Programs/refined.lnk",
  "%UserProfile%/Desktop/refined.lnk"];

  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      //write in the registry if windows OS
      if(process.platform === 'win32') {
        registerRegistry();
      }

      // Install desktop and start menu shortcuts


      //create windows shortcuts
      if(process.platform === 'win32') {
        for (var i = 0; i < lnkPath.length; i++) {
          ws.create(lnkPath[i], {
              target : exePath,
              desc : pjson.description
          });
        }
      }
      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers
      spawnUpdate(['--removeShortcut', exeName]);

      // Remove desktop and start menu shortcuts
      if(process.platform === 'win32') {
        for (var i = 0; i < lnkPath.length; i++) {
          ofs.access(lnkPath[i], ofs.F_OK, function(err) {
              if (!err) {
                ofs.unlink(lnkPath[i]);
              }
          });
        }
      }

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated

      app.quit();
      return true;
  }
};

app.on('window-all-closed', function () {

  client.gamesPlayed([]); //exit steam app

  if (process.platform !== 'darwin') {
    app.quit()
  }
});



app.on('ready', () => {
  createSplashScreen();
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
  refined.steamAuth.accountName = data.account;
  jsonfile.writeFileSync(__dirname+'/refined.json', refined, {spaces: 2});
});

client.on('loggedOn', function(details) {
  console.log(details);
  console.log("Logged into Steam as " + client.steamID.getSteam3RenderedID());
	client.setPersona(SteamUser.EPersonaState.Online);
	client.gamesPlayed(440);
  var resp = {
    success : false
  };
  resp.success = true;
  resp.data = details;
  //send the login status
  ipc.emit("connect",resp);
});

client.on('loginKey', function(key){
  refined.steamAuth.loginKey = key;
  jsonfile.writeFileSync(__dirname+'/refined.json', refined, {spaces: 2});
});

client.on('error', function(e) {
	// Some error occurred during logon
	console.log(e);
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

var playerInfos;

ipc.on('requestRefinedInfos', function (){
  playerInfos = false;
  if(client.steamID !== null){
    playerInfos = client;
    //launch Team Fortress 2
    client.gamesPlayed({"games_played": [{"game_id": 440}]});
  }
  ipc.emit("refinedInfos", {refined : refined, playerInfos : playerInfos});
});

//include tf2 listener
eval(fs.readFileSync(__dirname+'/tf2.js')+'');

//
// Create the splashscreen
//
// Also check for update -> Pre-render the app -> show the app

function createSplashScreen () {
  splashScreen = new BrowserWindow({
    width: 300,
    height: 300,
    show:false,
    resizable : false,
    frame:false,
    icon: __dirname + '/web/img/tgf/icon_circle.png'
  });

  splashScreen.loadURL(`file://${__dirname}/web/splash.html`);

  splashScreen.once('ready-to-show', () => {
    splashScreen.show();
    splashScreen.webContents.send("tgf_version",{version:pjson.version});
    splashScreen.webContents.send("splash_message",{message:"Checking for update..."});

    //check for updates
    let options = {
      repo: 'Cyriaqu3/refined',
      currentVersion: pjson.version
    }

    const updater = new GhReleases(options);

    // Check for updates
    // `status` returns true if there is a new update available
    console.log("Looking for update");
    updater.check((err, status) => {
      if(err){
        ipc.emit("splach_message",{message:err});
        console.log(err);
        splashScreen.webContents.send("splash_message",{message:"Loading..."});

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
          splashScreen.close();
          mainWindow.show();
          mainWindow.focus();

          autoConnectChecker(); //autoconnect the user if some ID are stored

        });
      }
      //update available
      else{
        // Download the update
        updater.download();
      }
    });

    // When an update has been downloaded
    updater.on('update-downloaded', (info) => {
      ipc.emit("splach_message",{message:"Installing update..."});
      // Restart the app and install the update
      updater.install()
    })

    // Access electrons autoUpdater
    updater.autoUpdater

  });

  splashScreen.on('closed', function () {
    splashScreen = null
  });
}

function autoConnectChecker(){
  if(refined.steamAuth.loginKey && refined.steamAuth.accountName){
    client.logOn({
      accountName: refined.steamAuth.accountName,
      loginKey: refined.steamAuth.loginKey
    });
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
