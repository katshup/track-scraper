const JSSoup = require('jssoup').default
const https = require('https')
const EventEmitter = require('events')
const utils = require('./utils')

class WMBR extends EventEmitter {
    BASE_URL = "track-blaster.com"

    constructor(){
        super()
        this.prog_map = {}
    }

    __generic_error_handle(error){
        process.stderr.write(JSON.stringify(error))
    }

    __process_programs(){
        let options = {hostname: this.BASE_URL, port: 443, path: '/wmbr/index.php', method: 'GET'}
        utils.request(options, response_data => {
            let soup = new JSSoup(response_data)
            let selectors = soup.findAll('select')
            let prog_selector = selectors.filter(item => item.attrs.name == "program")[0]
            prog_selector.findAll("option").forEach(item => this.prog_map[item.text] = item.attrs.value)
            // let whoever know that we loaded all the programs
            this.emit("programs_loaded", this.prog_map)
        }, this.__generic_error_handle)
    }

    process_show(show_name, err_callback){
        if (!(show_name in this.prog_map)){
            err_callback()
        }

        // url parameter for a particular show
        // these will never change, except for the page number
        let search_opt = {"startdt": "June 28, 1984", 
                          "enddt": new Date(Date.now()).toLocaleString('default', {month: 'long', day:'2-digit', year: 'numeric'}),
                          "sort": "desc",
                          "program": this.prog_map[show_name]
                         }

        let options = {hostname: this.BASE_URL, port: 443, path: '/wmbr/?' + utils.urlencode(search_opt), method: 'GET'}
        utils.request(options, response_data => {
            let soup = new JSSoup(response_data)
            let paginator = soup.find("ul", "pagination")
            var max_page = 1; 

            if (paginator != null){
                let links = paginator.findAll('li').filter(item => ((item.attrs.class == 'active') || (!('class' in item.attrs))))
                max_page = parseInt(utils.urldecode(links[links.length - 1].find("a").attrs.href)['page'])
            }
  
            
            let sho = new Show(show_name, max_page, search_opt)
            // console.log(sho)
            this.emit("show_processed", sho)
        })
    }
}

class Show extends EventEmitter {
    BASE_URL = "track-blaster.com"

    constructor(show_name, max_page, search_opt){
        super()
        this.show_name = show_name
        this.max_page = max_page
        this.search_opt = search_opt
        this.playlists = []
    }

    process_page(page_num, err_callback){
        if (page_num > this.max_page){
            err_callback(null)
        }

        this.search_opt['page'] = page_num  // recall search_opt is just the variables that specify what you're looking at

        let options = {hostname: this.BASE_URL, port: 443, path: '/wmbr/?' + utils.urlencode(this.search_opt), method: 'GET'}
        // console.log(options)
        utils.request(options, response_data => {
            let playlists = new Set()  
            let soup = new JSSoup(response_data)
            let a_tags = soup.findAll("a")
            a_tags.filter(item => item.attrs.href.includes("playlist.php")).forEach(item => playlists.add(item.attrs.href))  // list of playlist IDs
            // console.log(playlists)

            // on this page, get all the dates (note: we haven't started using the page number yet)
            // have to define the var beforehand because seems to be on strict mode?
            var pg = 1
            let date_divs = soup.findAll("h4", "index-h4")  // find all date headers
            let dates = new Array()  // array to put date text
            date_divs.forEach(item => {  // for each episode...
                dates.push(item.text)  // add to the dates list
                console.log(item.text)
            })

            let info_divs = soup.findAll("div", "col-DJ")  // find all divs with dj info. note: some are hidden
            // in order to filter the legitimate DJ names, need to find all "a" tags
            let djs = new Array()  // array to filter out hidden djs
            info_divs.forEach(item => {  // for each episode...
                let dj_link = item.find("a")  // find the dj link in div
                if (dj_link != null) {  // if there is a link in the dj div, then it's not hidden
                    // console.log(dj_link.text)
                    djs.push(dj_link.text)  // add to the djs list
                }
                // djs.add(dj_link.text)  // add dj name
            })
            console.log(playlists.size)  // check to see if they're the same length
            console.log(dates.length)  
            console.log(djs.length)

            // TODO: add dates and djs in dictionary form (maybe in same object as playlist IDs) to be listed out, and also passed to playlist
        

            Array.from(playlists).forEach((pl) => {  // turn playlist IDs into array and iterate over it
                // TODO: move the stuff that gets the DJ and date info up so that this is processed in Show rather than Playlist
                let pl_setup = new Playlist(this.show_name, pl)  // create the new playlist object to be set up with the basic info
                
                this.playlists.push( pl_setup )  // this already makes a new playlist with the basic attributes
            })
            // console.log(this.playlists)

            this.emit("playlists_found");
        }, err_callback)
    }
}

class Playlist extends EventEmitter {
    BASE_URL = "track-blaster.com"

    constructor(show_name, playlist){
        super()
        this.show_name = show_name;
        this.dj = "";
        this.date = "";
        this.playlist = playlist;
        this.entries = [];

    }

    process_playlist(){
        let options = {hostname: this.BASE_URL, port:443, path: '/wmbr/' + this.playlist, method: 'GET'};
        utils.request(options, response_data => {
            let soup = new JSSoup(response_data);

            let song_rows = soup.findAll("div", "print_song_in_set");
            song_rows.forEach((row, index) => {
                // a legit row has 5 entries along with their phantom siblings, so therefore 10 items at least ¯\_(ツ)_/¯
                if (row.contents.length >= 10){
                    let artist_name = ""
                    let song_name = ""
                    let album_name = ""
                    let real_time = 0

                    let artist = row.findAll("div", "col-Artist")[1];
                    if (artist != null){
                        let artist_a = artist.find("a");
                        if (artist_a != null){
                            artist_name = artist_a.text;
                        }
                    }

                    let song = row.findAll("div", "col-Song")[1];
                    if (song != null){
                        let song_a = song.find("a");
                        if (song_a != null){
                            song_name = song_a.text;
                        }
                    }

                    let album = row.find("div", "col-AlbumFormat");
                    if (album != null){
                        let album_a = album.find("a");
                        if (album_a != null){
                            album_name = album_a.text;
                        }
                    }

                    let time = row.findAll("div", "col-Time")[1];
                    if (time != null){
                        if (time.attrs.fulltime != null){
                            real_time = Date.parse(time.attrs.fulltime + " EST");
                        }
                    }

                    this.entries.push( new Entry(song_name, artist_name, album_name, real_time) );
                    
                }
            });
        });
    }    
}

// prolly wanna escape those html strings ¯\_(ツ)_/¯
class Entry {
    constructor(song_name, artist, album, playtime){
        this.song_name = song_name;
        this.artist = artist;
        this.album = album;
        this.playtime = playtime
    }
}

module.exports = {
    WMBR,
    Show,
    Playlist,
    Entry
};

// let w = new WMBR()

// w.on("programs_loaded", () => {
//     // console.log(w.prog_map)
//     w.process_show('Coffeetime', () => {
//         console.log("Error")
//     })
// })

// w.on("show_processed", (show) => {
//     show.process_page(1, (error) => {
//         console.log(error)
//         console.log("ERROR")
//     })
// })

// w.__process_programs()