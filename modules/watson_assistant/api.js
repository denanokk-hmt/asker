'use strict'

//Timeout
const pt = require('promise-timeout');

//config
const conf = require(REQUIRE_PATH.configure);

//System modules
const parser = require(`./parser_${conf.env.ui_module}`)


/**
 * Get Answer from Watson conversation
 * @param {*} conversation 
 * @param {*} watson 
 * @param {*} cmsg 
 * @param {*} res_context 
 */
const watsonAssistant = (conversation, watson, cmsg, res_context) => {
  return new Promise(function(resolve, reject) {
    conversation.message({ 
      workspace_id : watson.WORKSPACE_ID,
      input: { text: cmsg },
      context: res_context 
    }, function(err, response) {
      if (err) {
        reject(err);
      } else {
        response.ws = watson.Environment
        resolve(response);
      }
    })
  });
};

/**
 * API Call
 * @param {*} logiD
 * @param {*} client 
 * @param {*} answers 
 * @param {*} credentials 
 * @param {*} config
 * @param {*} ctalk_quest {message, history, worth_words}
 * @param {*} res_context 
 * @param {*} state 1.1.x 未実装
 */
const conversationAPI = (logiD, client, answers, credentials, config, ctalk_quest, res_context, state) => {

  //Get watson assistant answer & parse 
  const main = async () => {
    return await watsonAssistant(answers, credentials, ctalk_quest.message, res_context)
    .then(async results => {
      return parser.func(logiD, client, ctalk_quest, results, state)
    })
    .catch(err => {
      throw new Error(err)
    });
  }
  
  //Kick Main process with Timeout.
  return pt.timeout(main(), config.ai_timeout)
    .then(result => {
      return result
    })    
    .catch(err => {
      throw new Error(err)
  });
}
module.exports.func = conversationAPI;