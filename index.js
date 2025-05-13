const mineflayer = require('mineflayer')
const config = require('./config')

let reconnectAttempts = 0
const maxReconnectDelay = 60000 // 60 seconds
let isRegistered = false // Tracks if bot has registered (resets on restart)

const chatMessages = [
  'I’m here!',
  'Still active!',
  'Tehelka’s alive!',
  'Keeping the server alive!',
  'BOOOOOM!'
]

function createBot() {
  if (!config.authmePassword) {
    console.error('Error: AUTHME_PASSWORD not set in environment variables')
    return
  }

  console.log(`Starting bot with username ${config.username}... Attempt ${reconnectAttempts + 1}`)
  
  const bot = mineflayer.createBot({
    host: config.host,
    port: config.port,
    username: config.username,
    version: config.version
  })

  bot.on('spawn', () => {
    console.log(`${config.username} has spawned in the server!`)
    reconnectAttempts = 0

    // Anti-AFK: Chat and move every 30-60 seconds
    setInterval(() => {
      try {
        const message = chatMessages[Math.floor(Math.random() * chatMessages.length)]
        bot.chat(message)
        console.log(`Sent chat: ${message}`)

        const moveType = Math.random()
        if (moveType < 0.3) {
          bot.setControlState('forward', true)
          setTimeout(() => bot.setControlState('forward', false), 500)
        } else if (moveType < 0.6) {
          bot.setControlState('jump', true)
          setTimeout(() => bot.setControlState('jump', false), 200)
        } else {
          const direction = Math.random() < 0.5 ? 'left' : 'right'
          bot.setControlState(direction, true)
          setTimeout(() => bot.setControlState(direction, false), 300)
        }

        bot.look(Math.random() * 360, Math.random() * 180 - 90)
      } catch (err) {
        console.error('Error in anti-AFK actions:', err)
      }
    }, 30000 + Math.random() * 30000) // 30-60 seconds
  })

  // Handle AuthMe prompts via chat
  bot.on('message', (message) => {
    const msg = message.toString().toLowerCase()
    console.log(`Chat message: ${msg}`)

    if (msg.includes('register with /register') || msg.includes('please register')) {
      if (!isRegistered) {
        console.log('AuthMe: Sending /register command')
        bot.chat(`/register ${config.authmePassword} ${config.authmePassword}`)
        isRegistered = true
      }
    } else if (msg.includes('login with /login') || msg.includes('please login')) {
      console.log('AuthMe: Sending /login command')
      bot.chat(`/login ${config.authmePassword}`)
    }
  })

  bot.on('error', (err) => {
    console.error('Bot error:', err)
    if (err.message.includes('PartialReadError') || err.message.includes('ECONNRESET')) {
      bot.quit()
    }
  })

  bot.on('end', () => {
    reconnectAttempts++
    const delay = Math.min(10000 * Math.pow(2, reconnectAttempts), maxReconnectDelay)
    console.log(`Bot disconnected. Reconnecting in ${delay/1000} seconds...`)
    setTimeout(createBot, delay)
  })

  bot.on('kicked', (reason) => {
    console.log(`Bot was kicked for reason: ${reason}`)
    // Reset registration status on kick to handle re-registration if needed
    isRegistered = false
  })
}

createBot()
