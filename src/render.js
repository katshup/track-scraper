global.$ = $;

const {remote, ipcRenderer} = require('electron');
const {Menu, BrowserWindow, MenuItem, shell} = remote;

const pug = require('pug');

var show_selected = (input) => {
    console.log("you selected" + input);
    ipcRenderer.send("show_selected", input);
}

var pg_selected = (num) => {
    console.log("you selected page " + num);
    ipcRenderer.send("pg_selected", num);
}

// is called to generate a select option for each show
var gen_shows = pug.compile([ 
    // 'option(select = "selected") "Choose a show..."',  // TODO: this works visually but program treats it as a show and tries to process it. need to stop that
    'each show in shows',
    ' option= show'
  ].join('\n'));

// creates a select option for each page 
// (select is not the most classy way to do this, but just want to get to the playlist loading first and then can change it)
var gen_pages = pug.compile([
    'each i in pgs',  
    '  option= i + 1'
].join('\n'));

var gen_playlists = pug.compile([  // NOT FUNCTIONING YET
  // 'each playlist in current_playlists',
  // ' li(type = "checkbox")= playlist.date'  // TODO: need to make a string with dj and date, and list that
  'each testing in datetimes',
  ' li= testing'
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
    // console.log(shows)
    var select_element = $('#shows');  // assigns var to the select in the html
    select_element.html(gen_shows({ shows : Object.keys(shows) }));  // dictionary format, because that's what pug takes
    console.log(Object.keys(shows))
});

// user selected a show and we just parsed the (first) show page
ipcRenderer.on("show_loaded", (event, show) => {
    console.log("Show parsed.");
    console.log(`Maximum page for show ${show.show_name} is ${show.max_page}!`);

    var select_page = $('#pages');
    let limit = show.max_page  
    // need to do a while loop up to this number in pug, but don't know what to pass to it then
    let pgs = Array(limit).fill().map((element, index) => index)
    select_page.html(gen_pages({pgs : pgs}))  // sends page numbers to pug

});

// currently homeless:
// var playlist_selector = $('#playlists')  // corresponds to the playlist list in the html
//     datetimes = show.datetimes
//     console.log(datetimes)
//     djs = show.djs
//     // show_titles =  // iterate through number of playlists and create readable string for each playlist
//     // NOT FUNCTIONING YET:
//     playlist_selector.html(gen_playlists({datetimes : Object.keys(datetimes)}))
//     // playlist_selector.html(gen_playlists({show_titles : Object.keys(show_titles)}))