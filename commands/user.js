const ifunny = require('ifunny')
const util = require('../util')
const disk = require('../disk')
const { robot } = require('../bot')

const obj_max = (obj) => {
    let keys = Object.keys(obj)
    let max = keys[0]

    for (let key of keys) {
        max = (obj[key] > obj[max] ? key : max)
    }

    return max
}

async function on_user(message, args) {
    if (!args.length) {
        message.reply(robot.command_help('user'))
        return
    }

    if (await ifunny.User.by_nick(args[0])) {
        message.reply(`https://ifunny.co/user/${args[0]}`)
        return
    }

    message.reply('Could not find any such user')
}

async function on_check(message, args) {
    if (!args.length) {
        message.reply(robot.command_help('check'))
        return
    }

    let user = await ifunny.User.by_nick(args[0])

    if (user) {
        message.reply(`${args[0]} is taken by ${await user.nick}`)
        return
    }

    message.reply(`${args[0]} is free`)
}

async function on_pfp(message, args) {
    if (!args.length) {
        message.reply(robot.command_help('pfp'))
        return
    }

    let user = await ifunny.User.by_nick(args[0])

    if (user) {
        message.send_image_message((await user.profile_image)
            .url, { file_name: await user.nick })
        return
    }

    message.reply('Could not find any such user')
}

async function on_cover(message, args) {
    if (!args.length) {
        message.reply(robot.command_help('cover'))
        return
    }

    let user = await ifunny.User.by_nick(args[0])

    if (user) {
        message.send_image_message((await user.cover_image)
            .url, { file_name: await user.nick, width: 1080, height: 540 })
        return
    }

    message.reply('Could not find any such user')
}

async function on_pfp_url(message, args) {
    if (!args.length) {
        message.reply(robot.command_help('pfpurl'))
        return
    }

    let user = await ifunny.User.by_nick(args[0])

    if (user) {
        message.reply((await user.profile_image)
            .url)
        return
    }

    message.reply('Could not find any such user')
}

async function on_cover_url(message, args) {
    if (!args.length) {
        message.reply(robot.command_help('coverurl'))
        return
    }

    let user = await ifunny.User.by_nick(args[0])

    if (user) {
        message.reply((await user.cover_image)
            .url)
        return
    }

    message.reply('Could not find any such user')
}

async function on_about(message, args) {
    let chat = await message.chat
    let prefix = await chat.is_public ? '' : 'https://discord.com/'
    if (!args.length) {
        let usage = await disk.get_all_usage()
        let stats = await disk.get_messages()
        let op = stats.op || 0
        let nop = stats.nop || 1
        let ratio = Math.floor((op / (nop + op)) * 100)

        message.reply(
            `About ${await robot.nick}, made by kaffir
${op} times used
${Object.keys(usage).length} unique users
${ratio}% of ${op + nop} messages seen were commands
Join my discord at ${prefix}${robot.discord}`
        )
        return
    }

    let author = await message.author
    let nick = args[0] == 'me' ? await author.nick : args[0]
    let target = await ifunny.User.by_nick(nick)

    if (!target) {
        message.reply('Could not find any such user')
        return
    }

    let usage = await disk.get_commands_usage(target.id)
    let values = Object.values(usage)
    let total = values.length ? values.reduce((total, item) => { return total + item }) : 0

    message.reply(
        `About ${await target.nick}
${total} times used
Favorite command: ${values.length ? obj_max(usage) : 'nothing, yet!'}`
    )
}

robot.command.on('user', async (message, args) => {
    await on_user(message, args)
}, 'Get the link to the profile of some user')

robot.command.on('check', async (message, args) => {
    await on_check(message, args)
}, 'Check username availability')

robot.command.on('pfp', async (message, args) => {
    await on_pfp(message, args)
}, `Get the pfp of some user`)

robot.command.on('cover', async (message, args) => {
    await on_cover(message, args)
}, 'Get the cover of some user')

robot.command.on('pfpurl', async (message, args) => {
    await on_pfp_url(message, args)
}, `Get the pfp url of some user`)

robot.command.on('coverurl', async (message, args) => {
    await on_cover_url(message, args)
}, 'Get the cover url of some user')

robot.command.on('about', on_about, 'get information about a user, or the bot')

module.exports = { robot }
