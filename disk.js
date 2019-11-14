const fs = require('fs')

const file = './data.json'
var data = 'foobar'

const populated = {
    owners: {},
    bans: {},
    intros: {},
    admin: {},
    blacklist: {},
    prefix: {},
    exp: {},
    uses: {},
    messages: {}
}

async function unique_join(arrays) {
    let pile = []
    for (let sub of arrays) {
        pile = [...pile, ...sub]
    }

    return [...(new Set(pile))]
}

function load_data() {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, {})
    }

    try {
        data = JSON.parse(fs.readFileSync(file))

    } catch (err) {
        if (err instanceof SyntaxError) {
            data = JSON.parse('{}')
            return
        }

        throw err
    }
}

function populate() {
    for (let key of Object.keys(populated)) {
        if (!data[key]) {
            data[key] = {}
        }
    }

    write_data()
}

function write_data() {
    fs.writeFileSync(file, JSON.stringify(data))
}

async function set_owner(chat_id, user_id) {
    data.owners[chat_id] = user_id
    write_data()
}

async function get_owner(chat_id) {
    return data.owners[chat_id] || null
}

async function add_bans(chat_id, user_ids) {
    let bans = data.bans[chat_id] || []
    data.bans[chat_id] = await unique_join([bans, user_ids])

    write_data()
    return data.bans[chat_id]
}

async function remove_bans(chat_id, user_ids) {
    data.bans[chat_id] = (data.bans[chat_id] || [])
        .filter(it => !user_ids.includes(it))

    write_data()
    return data.bans[chat_id]
}

async function is_banned(chat_id, user_id) {
    let bans = data.bans[chat_id] || []
    return bans.includes(user_id)
}

async function set_intro(chat_id, section) {
    data.intros[chat_id] = section

    write_data()
    return data.intros[chat_id]
}

async function clear_intro(chat_id) {
    if (data.intros[chat_id]) {
        delete data.intros[chat_id]
    }

    write_data()
    return null
}

async function get_intro(chat_id) {
    return data.intros[chat_id] || data.intros.default || { enabled: false, text: '' }
}

async function toggle_admin_only(chat_id) {
    data.admin[chat_id] = !data.admin[chat_id]
    write_data()

    return data.admin[chat_id]
}

async function get_admin_only(chat_id) {
    return data.admin[chat_id] || false
}

async function add_blacklist(user_id) {
    data.blacklist[user_id] = true
    write_data()

    return data.blacklist[user_id]
}

async function toggle_blacklist(user_id) {
    data.blacklist[user_id] = !data.blacklist[user_id]
    write_data()

    return data.blacklist[user_id]
}

async function clear_blacklist(user_id) {
    if (data.blacklist[user_id] != undefined) {
        delete data.blacklist[user_id]
        write_data()
    }
}

async function get_blacklist(user_id) {
    return data.blacklist[user_id] || false
}

async function add_prefix(chat_id, prefix) {
    data.prefix[chat_id] = await unique_join(data.prefix[chat_id] || ['-'], [prefix])

    write_data()
    return data.prefix[chat_id]
}

async function set_prefix(chat_id, prefix) {
    data.prefix[chat_id] = [prefix]

    write_data()
    return data.prefix[chat_id]
}

async function get_prefix(chat_id) {
    return data.prefix[chat_id] || ['-']
}

async function get_exp(user_id) {
    return data.exp[user_id] || 0
}

async function add_exp(user_id, count) {
    data.exp[user_id] = (data.exp[user_id] || 0) + count
    write_data()

    return data.exp[user_id]
}

async function add_command_use(user_id, command) {
    if (!command) {
        return
    }

    let uses = data.uses[user_id] || {}
    uses[command] = (uses[command] || 0) + 1
    data.uses[user_id] = uses

    await add_oped()
    return uses[command]
}

async function get_command_use(user_id, command) {
    let uses = await get_commands_usage(user_id)
    return uses[command] || 0
}

async function get_commands_usage(user_id) {
    return data.uses[user_id] || {}
}

async function get_all_usage() {
    return data.uses
}

async function get_messages() {
    return data.messages
}

async function add_noped() {
    data.messages.nop = (data.messages.nop || 0) + 1
    write_data()
}

async function add_oped() {
    data.messages.op = (data.messages.op || 0) + 1
    write_data()
}

async function get_messages() {
    return data.messages
}

if (!fs.existsSync('badges')) {
    fs.mkdirSync('badges')
}

load_data()
populate()

module.exports = {
    load_data,
    set_owner,
    get_owner,

    add_bans,
    remove_bans,
    is_banned,

    set_intro,
    get_intro,

    toggle_admin_only,
    get_admin_only,

    add_blacklist,
    toggle_blacklist,
    clear_blacklist,
    get_blacklist,

    add_prefix,
    set_prefix,
    get_prefix,

    get_exp,
    add_exp,

    add_command_use,
    get_command_use,
    get_commands_usage,
    get_all_usage,

    add_noped,
    add_oped,
    get_messages
}
