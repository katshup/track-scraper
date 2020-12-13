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

        
        let search_opt = {"startdt": "June 28, 1984", 
                          "enddt": new Date(Date.now()).toLocaleString('default', {month: 'long', day:'2-digit', year: 'numeric'}),
                          "sort": "desc",
                          "program": this.prog_map[show_name]
                         }

        let options = {hostname: this.BASE_URL, port: 443, path: '/wmbr/?' + utils.urlencode(search_opt), method: 'GET'}
        utils.request(options, response_data => {
            let soup = new JSSoup(response_data)
            let paginator = soup.find("ul", "pagination")

            let links = paginator.findAll('li').filter(item => ((item.attrs.class == 'active') || (!('class' in item.attrs))))
            let max_page = utils.urldecode(links[links.length - 1].find("a").attrs.href)['page']
            
            this.emit("show_processed", new Show(show_name, max_page, search_opt))
        })
    }
}

class Show {
    BASE_URL = "track-blaster.com"

    constructor(show_name, max_page, search_opt){
        this.show_name = show_name
        this.max_page = max_page
        this.search_opt = search_opt
    }

    process_page(page_num, err_callback){
        if (page_num > this.max_page){
            err_callback(null)
        }

        this.search_opt['page'] = page_num

        let options = {hostname: this.BASE_URL, port: 443, path: '/wmbr/?' + utils.urlencode(this.search_opt), method: 'GET'}
        console.log(options)
        utils.request(options, response_data => {
            let playlists = new Set()
            let soup = new JSSoup(response_data)
            let a_tags = soup.findAll("a")
            a_tags.filter(item => item.attrs.href.includes("playlist.php")).forEach(item => playlists.add(item.attrs.href))

            console.log(playlists)
        }, err_callback)
    }
}

module.exports = {
    WMBR,
    Show
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