require('dotenv').config()
const puppeteer = require('puppeteer')
const mongoose = require('mongoose')

const { Client, Intents, MessageEmbed, Message } = require('discord.js')
const myIntense = new Intents()

myIntense.add(Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES)

const client = new Client({
  intents: myIntense,
})

const Product = new mongoose.Schema({
  link: String,
  title: String,
  price: String,
  image: String,
})

async function startParser(url, dbName) {
  const NewProduct = mongoose.model(dbName, Product)

  let flag = true
  let res = []
  let counter = 1

  try {
    let browser = await puppeteer.launch({
      headless: true,
      // devtools: true,
    })

    let page = await browser.newPage()

    await page.setViewport({
      width: 1400,
      height: 1200,
    })

    while (flag) {
      await page.goto(`${url}?page:on=${counter}`, {
        waitUntil: 'domcontentloaded',
      })
      await page.waitForSelector('button.pageControl')

      let html = await page.evaluate(
        async () => {
          let page = []

          try {
            let divs = document.querySelectorAll(
              'div.commerce-products-list-item'
            )

            divs.forEach((div) => {
              let a = div.querySelector('a.sr-only')
              let h3 = div.querySelector('h3.heading-3')
              let divPrice = div.querySelector('div.product-price')

              let obj = {
                link: a.href,
                title: h3.innerHTML,
                price: divPrice.innerHTML,
                image: '',
              }

              page.push(obj)
            })
          } catch (error) {
            console.log(error)
          }
          return page
        },
        {
          waitUntil: 'button.pageControl',
        }
      )
      await res.push(html)

      for (let i in res) {
        if (res[i].length === 0) flag = false
      }
      counter++
    }
    res = res.flat()
    await page.goto(`https://google.com`, { waitUntil: 'domcontentloaded' })
    console.log('Stop search products')

    for (let i = 0; i < res.length; i++) {
      // for (let i = 0; i < 3; i++) {
      const link = res[i].link

      await page.goto(link, { waitUntil: 'domcontentloaded' })
      await page.waitForSelector('img.shopify-image')

      let productHtml = await page.evaluate(
        async () => {
          let textLink = document.querySelector('img.shopify-image').outerHTML
          return textLink
        },
        {
          waitUntil: 'img.shopify-image',
        }
      )
      res[i]['image'] = productHtml
        .split(' ')
        [productHtml.split(' ').length - 1].split(';')[1]

      const candidate = await NewProduct.findOne({ title: res[i]['title'] })
      if (!candidate) {
        await NewProduct.create({ ...res[i] })
        console.log('Create product: ' + res[i].title)
        // Send message in channel
      }
    }

    await page.goto(`https://google.com`, { waitUntil: 'domcontentloaded' })
    console.log('Stop search images')
    await browser.close()
    console.log('Close browser')
  } catch (error) {
    console.log(error)
    await browser.close()
  }
}

client.login(process.env.BOT_TOKEN)

module.exports = (url, dbName) => startParser(url, dbName)
