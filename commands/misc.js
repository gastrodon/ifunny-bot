const ifunny = require('ifunny')
const axios = require('axios')
const disk = require('../disk')
const fs = require('fs')
const util = require('../util')
const { robot } = require('../bot')

const badge_template = fs.readFileSync('./templates/badge.html')
    .toString()
    .replace('%style', fs.readFileSync('./templates/badge.css')
        .toString())

const rank_backgrounds = {
    0: 'white',     // it's, uhh, white
    5: '#94EFFF',   // light blue
    10: '#94FFDB',  // greenblue
    15: '#94FFAF',  // green
    20: '#FFF694',  // yellow
    25: '#FFBF94',  // orange
    30: '#FF9494'   // pinkish
}

robot.rank_backgrounds = rank_backgrounds

async function render_badge(user) {
    let exp = await disk.get_exp(user.id)
    let rank = util.rank_for(exp)
    let ratio = (exp - util.exp_for(rank)) / (util.exp_for(rank + 1) - util.exp_for(rank))
    let color = rank_backgrounds[5 * Math.floor(rank / 5)] || 'white'

    let nick = await user.nick
    let proportion = 12 * (nick.length ** - .6)
    let pfp = await user.profile_image
    pfp = pfp ? pfp : { url: robot.nopfp } // workaround, don't know where puppeteer is rooted

    return badge_template
        .replace('%pfp', pfp.url)
        .replace('%subscribers', await user.subscriber_count || 0)
        .replace('%subscriptions', await user.subscription_count || 0)
        .replace('%days', await user.days || 0)
        .replace('%posts', await user.post_count || 0)
        .replace('%color', color)
        .replace(`%fontsize`, proportion)
        .replace('%nick', nick)
        .replace('%rank', rank)
        .replace('%fillwidth', Math.floor(ratio * 100))
        .replace('%emptywidth', 100 - Math.floor(ratio * 100))
}

async function on_whitelist(message, args) {
    let users = await util.users_from_nicks(args)

    for (let user of users) {
        await disk.clear_blacklist(user.id)
    }

    switch (users.length) {
        case 0:
            message.reply('Could not find any of those users')
            break
        case 1:
            message.reply(`${await users[0].nick} is whitelisted`)
            break
        default:
            let nicks = await Promise.all(users.map(it => it.nick))
            message.reply(`${nicks.join(', ')} are whitelisted`)
    }
}

async function on_blacklist(message, args) {
    let users = await util.users_from_nicks(args)

    for (let user of users) {
        await disk.add_blacklist(user.id)
    }

    switch (users.length) {
        case 0:
            message.reply('Could not find any of those users')
            break
        case 1:
            message.reply(`${await users[0].nick} is blacklisted`)
            break
        default:
            let nicks = await Promise.all(users.map(it => it.nick))
            message.reply(`${nicks.join(', ')} are blacklisted`)
    }
}

async function on_help(message, args) {
    if (!args.length) {
        args = Object.keys(robot._commands)
    }

    let help = args
        .filter(it => robot.command_help(it))
        .map(it => `${it}: ${robot.command_help(it)}`)

    message.reply(`Your prefix is ${(await robot._prefix(message))[0]}\n\n${help.join('\n\n')}`)
}

async function on_prefix(message, args) {
    let chat = await message.chat

    if (!args.length) {
        message.reply(robot.command_help('prefix'))
        return
    }

    await disk.set_prefix(chat.id, args[0])
    message.reply(`The prefix is now ${args[0]}`)
}

async function on_rank(message, args) {
    let author = await message.author
    let user = author

    if (args.length) {
        user = await ifunny.User.by_nick(args[0])

        if (!user) {
            message.reply('Could not find any such user')
            return
        }
    }

    let content = await render_badge(user)
    let path = `badges/${user.id}.png`
    let page = await robot.rank_view

    await page.setContent(content)
    await page.screenshot({ path: path })

    let link = await robot.sendbird_upload(fs.createReadStream(path))
    await message.send_image_message(link.url, { width: 720, height: 360 })
    fs.unlink(path, () => {})

    if (!await author.is_subscriber) {
        message.reply('2x exp for subscribers')
    }

}

async function on_uptime(message, args) {
    let uptime = robot.uptime

    let second = Math.floor(uptime) % 60
    let minute = Math.floor(uptime / 60) % 60
    let hour = Math.floor(uptime / (60 * 60)) % (60 * 60 * 60)
    let day = Math.floor(uptime / (60 * 60 * 24)) % (60 * 60 * 60 * 24)

    message.reply(`${day} days\n${hour} hours\n${minute} minutes\n${second} seconds`)
}

async function on_tell(message, args) {
    if (args.length < 2) {
        message.reply(robot.command_help('tell'))
        return
    }

    let user = await ifunny.User.by_nick(args[0], { client: robot })
    let content = args.slice(1)
        .join(' ')

    if (!user) {
        message.reply('Could not find any such user')
        return
    }

    let chat = await user.chat

    if (!chat) {
        message.reply(`Could not open a chat with ${await user.nick}`)
        return
    }

    let author = await message.author
    let prefix = (await robot._prefix(message))[0]
    chat.send_text_message(`${await author.nick} said "${content}"\n\nTo send a message, use ${prefix}tell`)
    message.reply('It was sent')

}

async function on_discord(message, args) {
    let chat = await message.chat
    let prefix = await chat.is_public ? '' : 'https://discord.gg/'
    message.reply(`${prefix}${robot.discord}`)
}

async function on_announce(message, args) {
    for await (let chat of robot.chats) {
        if (!await chat.is_direct) {
            try {
                await chat.send_text_message(`System announcement\n\n${args.join(' ')}`)
            } catch (err) {}
        }
    }

    message.reply('The announcement was sent')
}

async function on_colors(message) {
    await message.send_image_message(await robot.color_preview_file)
}

robot.command.on('whitelist', async (message, args) => {
    (await (
        await util.require_subscription(on_whitelist, message, args)
    ))(message, args)
}, 'Whitelist a user to use this bot')

robot.command.on('blacklist', async (message, args) => {
    return (await (
        await util.require_subscription(on_blacklist, message, args)
    )(message, args))
}, 'Blacklist a user from using this bot')

robot.command.on('help', async (message, args) => {
    await on_help(message, args)
}, 'You are here')

robot.command.on('prefix', async (message, args) => {
    (await (
        await util.not_direct(
            await util.allow_mod(on_prefix, message), message
        )
    ))(message, args)
}, 'Change my prefix in a group chat')

robot.command.on('rank', on_rank, 'The rank card for a user')

robot.command.on('uptime', on_uptime, 'Time online')

robot.command.on('tell', on_tell, 'Send a message to a user')

robot.command.on('discord', on_discord, 'Get the discord invite to my (new!) guild')

robot.command.on('announce', async (message, args) => {
    (await util.require_subscription(on_announce, message))(message, args)
})

robot.command.on('colors', on_colors, 'Preview my rank colors')

module.exports = { robot, on_rank }
