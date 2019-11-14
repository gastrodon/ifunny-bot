const axios = require('axios')
const config = require('../config.json')
const qs = require('qs');

class Booru {
    async random(tags, opts = {}) {
        let cap = opts.cap || 10
        let page = Math.ceil(cap * Math.random())
        let data

        while (page >= 1) {
            try {
                data = await axios({
                    method: 'GET',
                    url: this.api,
                    params: await this.params(tags, page)
                })
            } catch (err) {
                if (err.response) {
                    page -= Math.ceil(((page + 1) / 2) * Math.random())
                    continue
                }

                throw err
            }

            if (!data.data.length) {
                page -= Math.ceil(((page + 1) / 2) * Math.random())
                continue
            }

            let index = Math.floor(data.data.length * Math.random())
            return data.data[index]
        }
    }
}

class Dan extends Booru {
    constructor(key, login) {
        super()
        this.key = key
        this.login = login
        this.api = 'https://danbooru.donmai.us/posts.json'
    }

    async params(tags, page) {
        return {
            api_key: this.key,
            login: this.login,
            page: page || 1,
            tags: [...(tags || []), 'order:score'].join(' ')
        }
    }
}

class R34 extends Booru {
    constructor() {
        super()
        this.api = 'https://r34-json-api.herokuapp.com/posts'
    }

    async params(tags, page) {
        return {
            page: 1,
            pid: page,
            tags: tags.join(' ')
        }
    }
}

class Safe extends Booru {
    constructor() {
        super()
        this.api = 'https://safebooru.org/index.php'
    }

    async params(tags, page) {
        return {
            page: 'dapi',
            s: 'post',
            q: 'index',
            json: 1,
            pid: (page - 1) * 40,
            tags: tags.join(" ")
        }
    }
}

module.exports = {
    Dan: new Dan(config.dan_key, config.dan_login),
    R34: new R34(),
    Safe: new Safe()
}
