const ifunny = require('ifunny')

async function not_direct(wrapped, message) {
    let chat = await message.chat
    if (await chat.is_direct) {
        return (async (message, args) => {
            message.reply('That can only be done in groups')
        })
    }

    return wrapped
}

async function allow_admin(wrapped, message) {
    let chat = await message.chat
    let admin_ids = (await chat.admins)
        .map(it => it.id)

    if (!admin_ids.includes((await message.author)
            .id)) {
        return (async (message, args) => {
            message.reply('That can only be done by admins')
        })
    }

    return wrapped
}

async function allow_mod(wrapped, message) {
    let chat = await message.chat
    let ids = [
        ...((await chat.admins)
            .map(it => it.id)),
        ...((await chat.operators)
            .map(it => it.id))
    ]

    if (!ids.includes((await message.author)
            .id)) {
        return (async (message, args) => {
            message.reply('That can only be done by mods or admins')
        })
    }

    return wrapped
}

async function require_mod(wrapped, message) {
    let chat = await message.chat
    let ids = [
        ...((await chat.admins)
            .map(it => it.id)),
        ...((await chat.operators)
            .map(it => it.id))
    ]

    if (!ids.includes((await message.client)
            .id_sync)) {
        return (async (message, args) => {
            message.reply('I need to be an admin or operator to do that')
        })
    }

    return wrapped
}

async function require_own(wrapped, message) {
    let chat = await message.chat
    let ids = (await chat.admins)
        .map(it => it.id)

    if (!ids.includes((await message.client)
            .id_sync)) {
        return (async (message, args) => {
            message.reply('I need to have chat ownership to do that. The owner can use .own to transfer ownership, while keeping chat control')
        })
    }

    return wrapped
}

async function require_subscription(wrapped, message) {
    let author = await message.author

    if (!await author.is_subscriber) {
        return (async (message, args) => {
            message.reply('I am not subscribed to you')
        })
    }

    return wrapped
}

async function require_subscriber(wrapped, message) {
    let author = await message.author

    if (!await author.is_subscription) {
        return (async (message, args) => {
            message.reply('You are not subscribed to me')
        })
    }

    return wrapped
}

async function users_from_nicks(nicks) {
    return (await Promise.all(nicks
            .map(it => ifunny.User.by_nick(it))))
        .filter(it => it != null)
}

const exp_for = (rank) => { return Math.floor(30 * (rank ** 2)) }
const rank_for = (exp) => { return Math.floor((exp / 30) ** .5) }

module.exports = {
    not_direct,

    allow_admin,
    allow_mod,

    require_mod,
    require_own,

    require_subscription,
    require_subscriber,

    users_from_nicks,

    exp_for,
    rank_for
}
