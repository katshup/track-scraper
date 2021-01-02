const https = require('https')
const EventEmitter = require('events')

module.exports = {
    urlencode: function (obj){
        var str = []
        for (var p in obj)
            if (obj.hasOwnProperty(p)) {
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            }
        return str.join("&");
    },

    request: function (options, callback, err_callback){
        let req = https.request(options, res => {
            let response_data = ""
            res.on('data', data => {
                response_data += data
            })

            res.on('end', () => {
                callback(response_data)
            })
        })

        req.on('error', error => {
            err_callback(error)
        })

        req.end()
    },

    urldecode: function (uri){
        let map = {}
        uri = uri.replace("?", "")
        let components = uri.split("&")
        components.forEach(pair => {
            let kv = pair.split("=")
            map[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1])
        })

        return map
    },

    escapeHtml: function (unsafe) {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
     }
}
