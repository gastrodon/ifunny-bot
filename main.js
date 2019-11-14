const config = require('./config.json')
const { robot } = require('./bot')
const { set_intro } = require('./disk')


robot.pending_back_invites = {}
robot.rank_view
set_intro('default', { enabled: true, text: 'welcome, %s' })

require('./commands/admin')
require('./commands/chats')
require('./commands/booru')
require('./commands/misc')
require('./commands/user')
require('./events')

robot.start_chat = !process.argv.includes('no-chat')

robot.login(config.email, config.password)
