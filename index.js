const mongoose = require('mongoose')
const parser = require('./parser')
const { Client, Intents, MessageEmbed } = require('discord.js')
const myIntense = new Intents()

myIntense.add(Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES)

const client = new Client({
  intents: myIntense,
})

const linkArr = [
  {
    link: 'https://www.funko.com/shop-new-releases',
    name: 'shop-new-releases',
  },
  {
    link: 'https://www.funko.com/shop-best-sellers',
    name: 'shop-best-sellers',
  },
  {
    link: 'https://www.funko.com/shop-exclusives',
    name: 'shop-exclusives',
  },
  {
    link: 'https://www.funko.com/shop-back-in-stock',
    name: 'shop-back-in-stock',
  },
  {
    link: 'https://www.funko.com/shop-coming-soon',
    name: 'shop-coming-soon',
  },
]

mongoose.connect(
  'mongodb+srv://admin:admin@cluster0.dectr.mongodb.net/danidecho-bot?retryWrites=true&w=majority'
)

const ChannelID = new mongoose.Schema({
  name: String,
  channel_id: String,
  guild_id: String,
})

const Product = new mongoose.Schema({
  link: String,
  title: String,
  price: String,
  image: String,
})

const Channel = mongoose.model('ChannelID', ChannelID)
const SPBIS = mongoose.model('shop-back-in-stock', Product)
const SBS = mongoose.model('shop-best-sellers', Product)
const SCS = mongoose.model('shop-coming-soon', Product)
const SE = mongoose.model('shop-exclusives', Product)
const SNR = mongoose.model('shop-new-releases', Product)

function priceFix(str) {
  return str.split('&nbsp;').join('')
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on('guildCreate', (guild) => {
  const embed = (img, title, price, link) =>
    new MessageEmbed()
      .setColor('#0099ff')
      .setTitle(title)
      .setURL(link)
      .setColor('GREEN')
      .setImage(img)
      .setDescription(`Price: ${priceFix(price)}`)

  for (let i = 0; i < linkArr.length; i++) {
    const e = linkArr[i]
    guild.channels
      .create(e.name, {
        reason: e.link,
      })
      .then(async (channel) => {
        // Add database
        const candidate = await Channel.findOne({ name: e.name })
        if (!candidate) {
          await Channel.create({
            name: e.name,
            channel_id: channel.id,
            guild_id: guild.id,
          })
        } else {
          await Channel.findByIdAndUpdate(
            candidate._id,
            {
              name: e.name,
              channel_id: channel.id,
              guild_id: guild.id,
            },
            { new: true }
          )
        }
        // Send old products scrapper
        switch (e.name) {
          case 'shop-new-releases':
            const productsSNR = await SNR.find()
            for (let i = 0; i < productsSNR.length; i++) {
              // for (let i = 0; i < 3; i++) {
              const e = productsSNR[i]
              guild.channels.cache
                .get(channel.id)
                .send({ embeds: [embed(e.image, e.title, e.price, e.link)] })
            }
            break

          case 'shop-exclusives':
            const productsSE = await SE.find()
            for (let i = 0; i < productsSE.length; i++) {
              // for (let i = 0; i < 3; i++) {
              const e = productsSE[i]
              guild.channels.cache
                .get(channel.id)
                .send({ embeds: [embed(e.image, e.title, e.price, e.link)] })
            }
            break

          case 'shop-coming-soon':
            const productsSCS = await SCS.find()
            for (let i = 0; i < productsSCS.length; i++) {
              // for (let i = 0; i < 3; i++) {
              const e = productsSCS[i]
              guild.channels.cache
                .get(channel.id)
                .send({ embeds: [embed(e.image, e.title, e.price, e.link)] })
            }
            break

          case 'shop-best-sellers':
            const productsSBS = await SBS.find()
            for (let i = 0; i < productsSBS.length; i++) {
              // for (let i = 0; i < 3; i++) {
              const e = productsSBS[i]
              guild.channels.cache
                .get(channel.id)
                .send({ embeds: [embed(e.image, e.title, e.price, e.link)] })
            }
            break

          case 'shop-back-in-stock':
            const productsSPBIS = await SPBIS.find()
            for (let i = 0; i < productsSPBIS.length; i++) {
              // for (let i = 0; i < 3; i++) {
              const e = productsSPBIS[i]
              guild.channels.cache
                .get(channel.id)
                .send({ embeds: [embed(e.image, e.title, e.price, e.link)] })
            }
            break

          default:
            break
        }
      })
  }
})

// client.on('messageCreate', (msg) => {
//   console.log(msg.guildId)
// })

client.login(process.env.BOT_TOKEN)

// for (let i = 0; i < linkArr.length; i++) {
//   const element = linkArr[i]
//   parser(element.link, element.name)
// }

setInterval(() => {
  for (let i = 0; i < linkArr.length; i++) {
    const element = linkArr[i]
    parser(element.link, element.name)
  }
}, 900000)
