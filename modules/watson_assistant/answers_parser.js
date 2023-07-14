'use strict';

/**
 * Parsing answers credential
 * @param {*} credentials 
 */
const credencialParser = (credentials) => {
  //validation is value
  for (let idx in credentials) {
    if (!credentials[idx][1]) return null
  }
  let arry = {}
  arry.method = JSON.parse(credentials[0][1])
  arry.Environment = credentials[1][1]
  arry.WORKSPACE_ID = credentials[2][1]
  arry.CONVERSATION_USERNAME = credentials[3][1]
  arry.CONVERSATION_PASSWORD = credentials[4][1]
  arry.URL = credentials[5][1]
  arry.tag = JSON.parse(credentials[6][1])
  return arry
}
module.exports.credential = credencialParser


/**
 * Parsing answers config
 * @param {*} config 
 */
const configParser = (config) => {
  let arry = {}
  let exclusion_min_length_strings = []
  for (let idx in config) {
    let item = config[idx][0].split("-")
    switch (item[0]) {
      case 'exclusion_min_length_strings' :
        exclusion_min_length_strings.push(config[idx][1])
        break;
      default :
        arry[config[idx][0]] = config[idx][1]
    }
  }
  arry['exclusion_min_length_strings'] = exclusion_min_length_strings
  //console.log(arry)
  return arry
}
module.exports.config = configParser


/**
 * Parsing answers default messages
 * @param {*} config 
 */
const defaultMessagesParser = (messages) => {
  let arry = {}
  for (let idx in messages) {
    arry[messages[idx][0]] = messages[idx][1]
  }
  //console.log(arry)
  return arry
}
module.exports.defaultMessages = defaultMessagesParser