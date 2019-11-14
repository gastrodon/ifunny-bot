const ifunny = require('ifunny');
const disk = require('./disk')
const util = require('./util')
const { robot } = require('./bot')
const { on_rank } = require('./commands/misc')

const post_regex = /(https?:\/\/)?ifunny.co\/fun\/[a-zA-Z0-9]+/g
const user_regex = /(https?:\/\/)?ifunny.co\/user\/[a-zA-Z0-9]+/g

async function message_exp(message) {
    let author = await message.author
    let increment = await author.is_subscriber ? 2 : 1
    let exp = await disk.add_exp(author.id, increment)

    if (0 <= exp - util.exp_for(util.rank_for(exp)) &&
        exp - util.exp_for(util.rank_for(exp)) <= 1) {
        message.reply(`You have reached rank ${util.rank_for(exp)}. View your rank card with ${(await robot._prefix(message))[0]}rank`)
    }
}

async function message_users(message) {
    let content = await message.content

    let users = await Promise.all(content
            .match()
            .map(it => it.split('\/'))
            .map(it => it[it.length - 1])
            .map(it => ifunny.User.by_nick(it, { client: robot })))
        .filter(it => it)

    for (let user of users) {
        message.reply(`${await user.nick} has ${await user.subscriber_count} subscribers`)
    }
}

async function message_post(message) {
    let content = await message.content

    let posts = await content
        .match(post_regex)
        .map(it => it.split('\/'))
        .map(it => it[it.length - 1])
        .map(it => new ifunny.Post(it, { client: robot }))

    for (let post of posts) {
        message.reply(`${await post.smile_count} smiles, ${await post.comment_count} comments`)
    }
}

robot.on('login', async () => {
    await robot.color_preview_file

    if (robot.start_chat) {
        await robot.socket.start()
    }
})

robot.handler.on('connect', async () => {
    console.log(`${await robot.nick} is online`)
})

robot.handler.on('invite', async (invite) => {
    invite.accept()
})

robot.handler.on('user_exit', async (user, chat) => {
    if (robot.pending_back_invites[chat.id] == user.id) {
        await chat.invite(user)
        await chat.add_admins([user])
        robot.pending_back_invites[chat.id] = null
    }
})

robot.handler.on('user_join', async (user, chat) => {
    if (user.id == robot.id_sync) {
        return
    }

    if (await disk.is_banned(chat.id, user.id)) {
        try {
            await chat.kick(user.id)
            await chat.send_text_message(`${await user.nick} is banned`)
        } catch (err) {
            if (err.response && err.response.status !== 403) {
                throw err
            }
        }
        return
    }

    let intro = await disk.get_intro(chat.id)
    let uname = await user.nick

    if (intro.enabled) {

        if (intro.intro) {
            intro.text = intro.intro
            disk.set_intro(intro)
        }

        await chat.send_text_message(intro.text.replace(/(?<!\\)%s/g, uname))
    }
})

robot.handler.on('message', async (message) => {
    let chat = await message.chat
    chat.read()

    message_exp(message)

    let invoked = await message.invoked
    let author = await message.author

    if (invoked) {
        disk.add_command_use(author.id, invoked)
        return
    }

    disk.add_noped()
    let content = await message.content

    if (content.match(post_regex)) {
        message_post(message)
        return
    }

    if (await chat.is_direct) {
        let prefix = await robot._prefix(message)
        message.reply(`This is a bot, and my inbox is not monitored. To see my commands check ${prefix[0]}help.`)
        message.reply(`You can also join my discord at https://discord.com/${robot.discord}`)
    }
})

module.exports = { robot }
