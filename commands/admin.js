const ifunny = require('ifunny')
const util = require('../util')
const disk = require('../disk')
const { robot } = require('../bot')

async function on_admins(message, args) {
    let chat = await message.chat
    let nicks = new Set(await Promise.all((await chat.admins)
        .map(it => it.nick)))

    switch (nicks.size) {
        case 0:
            message.reply('There are no admins')
            break
        case 1:
            message.reply(`The admin here is ${[...nicks][0]}`)
            break
        default:
            message.reply(`The admins here are ${[...nicks].join(', ')}`)
    }
}

async function on_mods(message, args) {
    let chat = await message.chat
    let nicks = new Set(await Promise.all((await chat.operators)
        .map(it => it.nick)))

    switch (nicks.size) {
        case 0:
            message.reply('There are no mods')
            break
        case 1:
            message.reply(`The mod here is ${[...nicks][0]}`)
            break
        default:
            message.reply(`The mods here are ${[...nicks].join(', ')}`)
    }
}

async function on_admin(message, args) {
    let users = await util.users_from_nicks(args)
    let chat = await message.chat

    chat.add_admins(users)

    switch (users.length) {
        case 0:
            message.reply('Could not find any of those users')
            break
        case 1:
            message.reply(`${await users[0].nick} is now an admin`)
            break
        default:
            let nicks = await Promise.all(users.map(it => it.nick))
            message.reply(`${nicks.join(', ')} are now admins`)
    }
}

async function on_unadmin(message, args) {
    let chat = await message.chat
    let users = await util.users_from_nicks(args)

    chat.remove_admins(users)

    switch (users.length) {
        case 0:
            message.reply('Could not find any of those users')
            break
        case 1:
            message.reply(`${await users[0].nick} is no longer an admin`)
            break
        default:
            let nicks = await Promise.all(users.map(it => it.nick))
            message.reply(`${nicks.join(', ')} are no longer admins`)
    }
}

async function on_mod(message, args) {
    let users = await util.users_from_nicks(args)

    for (let user of users) {
        (await message.chat)
        .add_operator(user)
    }

    switch (users.length) {
        case 0:
            message.reply('Could not find any of those users')
            break
        case 1:
            message.reply(`${await users[0].nick} is now a mod`)
            break
        default:
            let nicks = await Promise.all(users.map(it => it.nick))
            message.reply(`${nicks.join(', ')} are now mods`)
    }
}

async function on_unmod(message, args) {
    let users = await util.users_from_nicks(args)

    for (let user of users) {
        (await message.chat)
        .remove_operator(user)
    }

    switch (users.length) {
        case 0:
            message.reply('Could not find any of those users')
            break
        case 1:
            message.reply(`${await users[0].nick} is no longer a mod`)
            break
        default:
            let nicks = await Promise.all(users.map(it => it.nick))
            message.reply(`${nicks.join(', ')} are no longer mods`)
    }
}

async function on_adminuse(message) {
    let status = await disk.toggle_admin_only((await message.chat)
        .id) ? 'enabled' : 'disabled'

    message.reply(`Admin only use was toggled, it's now ${status}`)
}

robot.command.on('admins', async (message, args) => {
    (await (
        await util.not_direct(on_admins, message)
    ))(message, args)
}, 'List the admins of this chat')

robot.command.on('mods', async (message, args) => {
    (await (
        await util.not_direct(on_mods, message)
    ))(message, args)
}, 'List the mods of this chat')

robot.command.on('unadmin', async (message, args) => {
    (await (
        await util.not_direct(
            await util.allow_admin(on_unadmin, message), message
        )
    ))(message, args)
}, 'Remove an admin from this chat')

robot.command.on('admin', async (message, args) => {
    (await (
        await util.not_direct(
            await util.allow_admin(on_admin, message), message
        )
    ))(message, args)
}, 'Add an admin to this chat')

robot.command.on('unmod', async (message, args) => {
    (await (
        await util.not_direct(
            await util.allow_admin(on_unmod, message), message
        )
    ))(message, args)
}, 'Remove a mod from this group')

robot.command.on('mod', async (message, args) => {
    (await (
        await util.not_direct(
            await util.allow_admin(on_mod, message), message
        )
    ))(message, args)
}, 'Add a mod to this group')

robot.command.on('adminuse', async (message, args) => {
    (await (
        await util.not_direct(
            await util.allow_mod(on_adminuse, message), message
        )
    ))(message, args)
}, 'Toggle admin only mode in this chat')

module.exports = { robot }
