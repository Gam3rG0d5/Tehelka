const mineflayer = require('mineflayer')
const config = require('./config')

let reconnectAttempts = 0
const maxReconnectDelay = 60000 // 60 seconds
let isRegistered = false // Tracks if bot has registered (resets on restart)

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

    // Anti-AFK: Move with WASD and jump every 30-60 seconds
    setInterval(() => {
      try {
        const moveType = Math.random()
        let action
        if (moveType < 0.2) {
          // Forward (W)
          bot.setControlState('forward', true)
          setTimeout(() => bot.setControlState('forward', false), 500)
          action = 'Forward'
        } else if (moveType < 0.4) {
          // Backward (S)
          bot.setControlState('back', true)
          setTimeout(() => bot.setControlState('back', false), 500)
          action = 'Backward'
        } else if (moveType < 0.6) {
          // Left (A)
          bot.setControlState('left', true)
          setTimeout(() => bot.setControlState('left', false), 500)
          action = 'Left'
        } else if (moveType < 0.8) {
          // Right (D)
          bot.setControlState('right', true)
          setTimeout(() => bot.setControlState('right', false), 500)
          action = 'Right'
        } else {
          // Jump
          bot.setControlState('jump', true)
          setTimeout(() => bot.setControlState('jump', false), 200)
          action = 'Jump'
        }

        console.log(`Moving: ${action}`)
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
        console.log('AuthMe: Preparing to send /register command')
        setTimeout(() => {
          bot.chat(`/register ${config.authmePassword} ${config.authmePassword}`)
          console.log(`AuthMe: Sent /register ${config.authmePassword} ${config.authmePassword}`)
          isRegistered = true
        }, 2000) // 2-second delay
      }
    } else if (msg.includes('login with /login') || msg.includes('please login')) {
      console.log('AuthMe: Preparing to send /login command')
      setTimeout(() => {
        bot.chat(`/login ${config.authmePassword}`)
        console.log(`AuthMe: Sent /login ${config.authmePassword}`)
      }, 2000) // 2-second delay
    }
  })

  bot.on('error', (err) => {
    console.error('Bot error:', err)
    if (err.message.includes('PartialReadError') || err.message.includes('ECONNRESET')) {
      isRegistered = false // Reset to allow re-registration
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
    isRegistered = false // Reset to handle re-registration
  })
}

createBot()
