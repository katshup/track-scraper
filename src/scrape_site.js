const JSSoup = require('jssoup').default
const https = require('https')
const EventEmitter = require('events')

class WMBR extends EventEmitter {
    BASE_URL = "track-blaster.com"

    constructor(){
        super()
        this.prog_map = {}
    }

    __process_programs(){
        let options = {hostname: this.BASE_URL, port: 443, path: '/wmbr/index.php', method: 'GET'}
        let req = https.request(options, res => {
            let response_data = ""
            
            // apparently you might get your data in chunks, so save them off to a variable
            res.on('data', data => {
                response_data += data
            })

            // data stream just finished, process it now
            res.on('end', () => {
                let soup = new JSSoup(response_data)
                let selectors = soup.findAll('select')
                let prog_selector = selectors.filter(item => item.attrs.name == "program")[0]
                prog_selector.findAll("option").forEach(item => this.prog_map[item.text] = item.attrs.value)
                // let whoever know that we loaded all the programs
                this.emit("programs_loaded")
            })
        })

        req.on('error', error => {
            process.stderr.write(JSON.stringify(error))
        })

        req.end()
    }

    process_show(show_name){
        
    }
}

let w = new WMBR()

w.on("programs_loaded", () => {
    console.log(w.prog_map)
})

w.__process_programs()