const lists = require(`./modules.json`).modules
for (let i in lists) {
  module.exports[i] = require(`${REQUIRE_PATH.hanger}${lists[i]}`)
  console.log(`require & moduler exported::${i}`)
}