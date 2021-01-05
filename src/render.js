global.$ = $;

const {remote, ipcRenderer} = require('electron');
const {Menu, BrowserWindow, MenuItem, shell} = remote;

const pug = require('pug');

var show_selected = (input) => {
    console.log("you selected" + input);
    ipcRenderer.send("show_selected", input);
}

// is called to generate a select option for each show
var gen_shows = pug.compile([ 
    // 'option(select = "selected") "Choose a show..."',  // TODO: this works visually but program treats it as a show and tries to process it. need to stop that
    'each show in shows',
    ' option= show'
  ].join('\n'));

var gen_playlists = pug.compile([  // NOT FUNCTIONING YET
  'each playlist in current_playlists',
  ' li(type = "checkbox")= playlist.date'  // TODO: need to make a string with dj and date, and list that
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
    var select_element = $('#shows');  // assigns var to the select in the html
    select_element.html(gen_shows({ shows : Object.keys(shows) }));  // dictionary format, because that's what pug takes
});

// user selected a show and we just parsed the show page
ipcRenderer.on("show_loaded", (event, show) => {
    console.log("Show parsed.");
    console.log(`Maximum page for show ${show.show_name} is ${show.max_page}!`);

    var playlist_selector = $('#playlists')  // corresponds to the playlist list in the html
    current_playlists = show.playlists
    //console.log(current_playlists)
    // current_playlists.forEach(item => console.log('hellooooo?'))
    // NOT FUNCTIONING YET:
    // playlist_selector.html(gen_playlists({current_playlists : Object.keys(current_playlists)}))
});