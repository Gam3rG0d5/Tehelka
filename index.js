const mineflayer = require('mineflayer')
const config = require('./config')

// Function to create and start the bot
function createBot() {
  console.log(`Starting bot with username ${config.username}...`)
  
  const bot = mineflayer.createBot({
    host: config.host,
    port: config.port,
    username: config.username,
    version: config.version
  })

  // Handle bot spawn
  bot.on('spawn', () => {
    console.log(`${config.username} has spawned in the server!`)

    // Periodic anti-AFK actions
    setInterval(() => {
      try {
        // Send a chat message
        bot.chat('I’m still here!')
        // Move slightly (random small movement)
        bot.setControlState('forward', true)
        setTimeout(() => bot.setControlState('forward', false), 500)
        // Randomly look around
        bot.look(Math.random() * 360, Math.random() * 180 - 90)
      } catch (err) {
        console.error('Error in anti-AFK actions:', err)
      }
    }, 60000) // Every 60 seconds
  })

  // Handle errors
  bot.on('error', (err) => {
    console.error('Bot error:', err)
  })

  // Handle disconnection and reconnect
  bot.on('end', () => {
    console.log('Bot disconnected. Attempting to reconnect in 10 seconds...')
    setTimeout(createBot, 10000) // Reconnect after 10 seconds
  })

  // Handle being kicked
  bot.on('kicked', (reason) => {
    console.log(`Bot was kicked for reason: ${reason}`)
  })
}

// Start the bot
createBot()