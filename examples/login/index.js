'use strict'

require('dotenv-safe').config()

const puppeteer = require('puppeteer')
const { Ta11y } = require('@ta11y/core')

const main = async () => {
  // Create a browser that we'll initialize with cookies and then use to run the ta11y audit
  const browser = await puppeteer.launch({ headless: false, slowMo: 10 })
  const page = await browser.newPage()

  await page.goto(
    'https://www.instagram.com/accounts/login/?source=auth_switcher',
    {
      waitUntil: 'networkidle2'
    }
  )

  // email
  await page.waitForSelector("[name='username']")
  await page.type("[name='username']", process.env.INSTAGRAM_USERNAME)

  // password
  await page.keyboard.down('Tab')
  await page.keyboard.type(process.env.INSTAGRAM_PASSWORD)

  // click the log in button
  await page.evaluate(() => {
    const btns = [
      ...document.querySelector('.HmktE').querySelectorAll('button')
    ]

    btns.forEach(function(btn) {
      if (btn.innerText.toLowerCase().trim() === 'log in') {
        btn.click()
      }
    })
  })

  await page.waitForNavigation()

  // we should now be logged in
  console.log('cookies', await page.cookies())
  console.log('-'.repeat(80))
  await page.close()

  const ta11y = new Ta11y()

  // Pass the initialized browser to ta11y and perform a basic crawl from the authenticated
  // Instagram homepage. Any pages that ta11y visits will inherit all of the auth cookies
  // we previously initialized by logging in above.
  const results = await ta11y.audit('https://instagram.com', {
    browser,
    crawl: true,
    maxDepth: 1,
    maxVisit: 4
  })

  console.log(JSON.stringify(results, null, 2))

  browser.close()
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
