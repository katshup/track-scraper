const { app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const scraper = require('./scrape_site.js');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

let w = new scraper.WMBR();

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on("prog_ready", (event, arg) => {  // programS ready
  // console.log(arg);

  w.on("programs_loaded", (shows) => {
    console.log(Object.keys(shows))
    event.reply("shows_ready", shows);
  });

  w.__process_programs();
});

ipcMain.on("show_selected", (event, arg) => { // arg is the show object
  
  w.once("show_processed", (show) => {
    event.reply("show_loaded", show);
  });
  
  w.process_show(arg, () => {
    console.log("Show not available");
  });

});

// need to receive the "pg_selected" message and then process the right page
ipcMain.on("pg_selected", (event, pg_num, show) => {  // gets num from pg_selected
  console.log('paage' + pg_num)
  console.log("show" + show)

  if (show in w.show_map){
    w.show_map[show].process_page(pg_num, (playlists) => {
      event.reply("playlists_ready", playlists);
    },  (error) => {  // index show map with currently selected show from selector
      console.log(error);
    });
  } else {
    console.log(w.show_map)
  }
  
})



// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
