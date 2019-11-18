const ifunny = require('ifunny')
const util = require('../util')
const { robot } = require('../bot')
const disk = require('../disk')

async function on_own(message, args) {
    let author = await message.author
    let chat = await message.chat

    robot.pending_back_invites[chat.id] = author.id
    disk.set_owner(chat.id, author.id)

    message.reply('You can now leave and transfer ownership to me, and I will invite you back.')
}

async function on_kick(message, args) {
    let chat = await message.chat
    let users = await util.users_from_nicks(args)
    let author = await message.author
    let owner_id = await disk.get_owner(chat.id)

    if (owner_id != author.id) {
        let admin_ids = (await chat.admins)
            .map(it => it.id)

        admins = users
            .filter(it => admin_ids.includes(it.id))

        if (admins.length) {
            message.reply('You may not kick admins')
            return
        }
    }

    if (users.length == 0) {
        message.reply('Could not find any of those users')
        return false
    }

    for (let user of users) {
        try {
            await chat.kick(user)
        } catch (err) {
            if (err.response && err.response.status == 403) {
                message.reply('I need to be chat owner to do that')
                return false
            } else if (err.response && err.response.status == 500) {
                message.reply(`${await user.nick} is not in this chat`)
            } else { throw err }
        }
    }

    return true
}

async function on_ban(message, args) {
    if (!await on_kick(message, args)) {
        return
    }

    let chat = await message.chat
    let users = (await util.users_from_nicks(args))

    disk.add_bans(chat.id, users.map(it => it.id))

    let nicks = await Promise.all(users.map(it => it.nick))
    message.reply(`${nicks.join(', ')} have been banned`)

}

async function on_unban(message, args) {
    let chat = await message.chat
    let users = (await util.users_from_nicks(args))

    if (users.length == 0) {
        message.reply('Could not find any of those users')
        return
    }

    disk.remove_bans(chat.id, users.map(it => it.id))

    let nicks = await Promise.all(users.map(it => it.nick))
    message.reply(`${nicks.join(', ')} have been unbanned`)

}

async function on_setintro(message, args) {
    let chat = await message.chat
    let intro = args.join(' ')
    disk.set_intro(chat.id, { text: intro, enabled: true })
    message.reply('The intro was set to this:')
    message.reply(intro)
}

async function on_clearintro(message) {
    disk.clear_intro((await message.chat)
        .id)
    message.reply('The intro was reset')
}

async function on_invite(message, args) {
    let users = await util.users_from_nicks(args)
    let chat = await message.chat

    for (let user of users) {
        chat.invite(user)
    }

    switch (users.length) {
        case 0:
            message.reply('Could not find any of those users')
            break
        case 1:
            message.reply(`${await users[0].nick} was invited`)
            break
        default:
            let nicks = await Promise.all(users.map(it => it.nick))
            message.reply(`${nicks.join(', ')} were invited`)

    }
}

async function on_invites(message, args) {
    let chat = await message.chat
    let nicks = []

    for await (let user of chat.invited_members) {
        nicks.push(await user.nick)
    }

    switch (nicks.length) {
        case 0:
            message.reply('There are no invited users')
            break
        case 1:
            message.reply(`${nicks[0]} has a pending invite`)
        default:
            message.reply(`Users with pending invites\n${nicks.join('\n')}`)

    }
}

robot.command.on('own', async (message, args) => {
        (await (
            await util.not_direct(
                await util.allow_admin(on_own, message), message
            )
        ))(message, args)
    },
    'Give the bot ownership of this chat, while remaining in control')

robot.command.on('kick', async (message, args) => {
        (await (
            await util.not_direct(
                await util.allow_mod(
                    await util.require_own(on_kick, message), message
                ), message
            )
        ))(message, args)
    },
    'Kick a user from this chat')

robot.command.on('ban', async (message, args) => {
    (await (
        await util.not_direct(
            await util.allow_admin(
                await util.require_own(on_ban, message), message
            ), message
        )
    ))(message, args)
}, 'Ban a user from this chat, so that they are kicked when they try to rejoin')

robot.command.on('bean', async (message, args) => {
    (await (
        await util.not_direct(
            await util.allow_admin(
                await util.require_own(on_ban, message), message
            ), message
        )
    ))(message, args)
})

robot.command.on('unban', async (message, args) => {
    (await (
        await util.not_direct(
            await util.allow_admin(
                await util.require_own(on_unban, message), message
            ), message
        )
    ))(message, args)
}, 'Unban a user from this chat')

robot.command.on('setintro', async (message, args) => {
    (await (
        await util.not_direct(
            await util.allow_admin(on_setintro, message), message
        )
    ))(message, args)
}, 'Set the intro for this chat. %s will be replaced by the joining users username')

robot.command.on('clearintro', async (message, args) => {
    (await (
        await util.not_direct(
            await util.allow_admin(on_clearintro, message), message
        )
    ))(message, args)
}, 'Clear the custom intro for this chat')

robot.command.on('invite', async (message, args) => {
    (await (
        await util.not_direct(on_invite, message)
    ))(message, args)
}, 'Invite a user to this chat')

robot.command.on('add', async (message, args) => {
    (await (
        await util.not_direct(on_invite, message)
    ))(message, args)
})

robot.command.on('invites', async (message, args) => {
    (await (
        await util.not_direct(on_invites, message)
    ))(message, args)
}, 'See who has been invited to this chat')

module.exports = { robot }
