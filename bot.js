const ifunny = require('ifunny')
const fs = require('fs');
const puppeteer = require('puppeteer')
const config = require('./config.json')
const disk = require('./disk')

class Beeper extends ifunny.Client {
    constructor(opts = {}) {
        super(opts)
        this._puppet = null
        this._rank_view = null
        this._card_url = null
        this._start_time = Date.now()

        this.discord = '8HH5XTJ'
        this.nopfp = 'https://i.imgur.com/m9oRga5.png'
        this.start_chat = true
    }

    async resolve_command(message) {
        if (!this._prefix) {
            return null
        }

        let slice = await this.prefix_slice(message)

        if (!slice) {
            return null
        }

        let content = await message.content
        let c_name = content.split(" ")[0].slice(slice)
        let args = content.split(" ")
            .slice(1)
        let chat = await message.chat
        let mod_ids = [
            ...((await chat.admins)
                .map(it => it.id)),
            ...((await chat.operators)
                .map(it => it.id))
        ]
        let admin_only = await disk.get_admin_only(chat.id)
        let author = await message.author

        if (this._commands[c_name] !== undefined) {
            if (await disk.get_blacklist(author.id)) {
                message.reply('You are blacklisted from this bot')
                return null
            }

            if (admin_only && !mod_ids.includes(author.id)) {
                message.reply('Admin only use is enabled in this chat')
                return null
            }

            this.command.emit(c_name, message, args)
            return c_name
        }

        return null
    }

    get uptime() {
        return (Date.now() - this._start_time) / 1000
    }

    get puppet() {
        return (async () => {
            if (!this._puppet) {
                this._puppet = await puppeteer.launch({
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                })
            }

            return this._puppet
        })()
    }

    get rank_view() {
        return (async () => {
            if (!this._rank_view) {
                this._rank_view = await (await this.puppet)
                    .newPage()
                await this._rank_view.setViewport({ width: 720, height: 360 })
            }

            return this._rank_view
        })()
    }

    get color_preview_file() {
        return (async () => {
            if (!this._card_url) {
                let card = ''
                let keys = Object.keys(this.rank_backgrounds)
                let path = './badges/preview.png'

                for (let rank of keys) {
                    card += `<div class="preview"
                            style="background: ${this.rank_backgrounds[rank]};">
                            Rank ${rank}</div>`
                }

                card = `<head><style>%style</style></head>
                        <div id="body">${card}</div>`
                    .replace('%style', fs.readFileSync('./templates/card.css')
                        .toString())

                let view = await (await this.puppet)
                    .newPage()

                await view.setViewport({ width: 500, height: 70 * keys.length })
                await view.setContent(card)
                await view.screenshot({ path: path })

                this._card_url = (await robot.sendbird_upload(fs.createReadStream(path)))
                    .url
            }

            return this._card_url
        })()
    }
}

async function prefix_of(message) {
    let chat = await message.chat

    if (await chat.is_direct) {
        return ['-', '.', ',', '\\', '/', '~']
    }

    return await disk.get_prefix(chat.id)

}

const robot = new Beeper({
    prefix: prefix_of,
    reconnect: true
})

module.exports = { robot }
