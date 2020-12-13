global.$ = $;

const {remote, ipcRenderer} = require('electron');
const {Menu, BrowserWindow, MenuItem, shell} = remote;

const pug = require('pug');

var gen_shows = pug.compile([
    'each show in shows',
    ' option= show'
  ].join('\n'));

$(document).ready(function() {
    console.log("program ready to talk to main");
    ipcRenderer.send("prog_ready", "doot");
});

ipcRenderer.on("shows_ready", (event, shows) => {
    console.log("shows are ready");
    console.log(shows)
    var select_element = $('#shows');
    select_element.html(gen_shows({ shows : Object.keys(shows) }));
});