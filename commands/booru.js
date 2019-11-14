const ifunny = require('ifunny')
const { Dan, R34 } = require('../libs/booru')
const { robot } = require('../bot')

async function on_dan(message, args) {
    on_tags(message, [`${args.join('_')}*`, '-rating:safe'])
}

async function on_tags(message, args) {
    post = await Dan.random(args)

    if (!post) {
        message.reply(`Nothing was found for the tags ${args.join(', ')}`)
        return
    }

    await message.send_image_message(post.file_url, {
        height: post.image_height || 780,
        width: post.image_width || 780
    })
    message.reply(`Artist: ${post.tag_string_artist || 'unknown'}\nPost id: ${post.id}`)
}

async function on_r34(message, args) {
    on_rtags(message, [`${args.join('_')}*`, '-rating:safe'])
}

async function on_rtags(message, args) {
    post = await R34.random(args)

    if (!post) {
        message.reply(`Nothing found for the tags ${args.join(', ')}`)
        return
    }

    await message.send_image_message(post.file_url, {
        height: post.sample_height,
        width: post.sample_width
    })
    message.reply(`Post id: ${post.id}`)
}

robot.command.on('dan', on_dan, 'Look for a tag on Danbooru')

robot.command.on('gel', on_dan)

robot.command.on('tags', on_tags, 'Query exact tags on Danbooru')

robot.command.on('r34', on_r34, 'Look for a tag on rule34.xxx')

robot.command.on('rule34', on_r34)

robot.command.on('rtags', on_rtags, 'Query exact tags on rule34.xxx')

module.exports = { robot }
