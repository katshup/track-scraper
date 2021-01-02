global.$ = $;

const {remote, ipcRenderer} = require('electron');
const {Menu, BrowserWindow, MenuItem, shell} = remote;

const pug = require('pug');

var show_selected = (input) => {
    console.log("you selected" + input);
    ipcRenderer.send("show_selected", input);
}

var gen_shows = pug.compile([
    'each show in shows',
    ' option= show'
  ].join('\n'));

// page is ready, tell the main process to scrape the wbmr site
$(document).ready(function() {
    console.log("program ready to talk to main");
    ipcRenderer.send("prog_ready", "doot");
});

// Event gets fired when the list of shows is parsed by the scraper
// loads all available shows into a selector list
ipcRenderer.on("shows_ready", (event, shows) => {
    console.log("shows are ready");
    console.log(shows)
    var select_element = $('#shows');
    select_element.html(gen_shows({ shows : Object.keys(shows) }));
});

// user selected a show and we just parsed the show page
ipcRenderer.on("show_loaded", (event, show) => {
    console.log("Show parsed.");
    console.log(`Maximum page for show ${show.show_name} is ${show.max_page}!`);
});