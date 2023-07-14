'use strict'

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code
const status = conf.status


/////////////////////////////////////////////////
/**
 * Result arrange
 * get intents, entiteis, arrange talk
 * @param {*} answer 
 * @param {int} idx
 */
const resultArrange = (answer, idx) => {

  //Get intents or set 0
  let intents
  if (Object.keys(answer.intents).length) {
    let sum = 0
    for (let idx in answer.intents) {
      sum += answer.intents[idx].confidence
    }
    intents = {
      intents : answer.intents,
      confidence : sum,
    }
  } else {
    intents = {
      intents : null,
      confidence : 0,
    }
  }

  //Get entities or set 0
  let entities
  if (Object.keys(answer.entities).length) {
    entities = answer.entities
    let sum = 0
    for (let idx in answer.entities) {
      sum += answer.entities[idx].confidence
    }
    entities = {
      entities : answer.entities,
      confidence : sum,
    }
  } else {
    entities = {
      entities : null,
      confidence : 0,
    }    
  }

  //Set response type & contents.message
  let res_type, res_msg
  if (!answer.output.text[idx].type) {
    res_type = 'text'
    res_msg = answer.output.text[idx]
  } else {
    res_type = answer.output.text[idx].type
    res_msg = answer.output.text[idx].content.message
  }
  
  ///////////////////////////////////////
  //User.user
  ///////////////////////////////////////
  //Replace context
  for (let content_name in answer.context) {
    res_msg = String(res_msg).replace(new RegExp(`\\<\\?\\$${content_name}\\?\\>`, 'g'), answer.context[content_name])
  }

  //Set bot talking for response set
  let talk
  if (answer.output.text[idx].type) {
    answer.output.text[idx].content.message = res_msg
    talk = answer.output.text[idx]
  } else {
    talk = {
      type: 'text',
      content: {
        message: res_msg,
      },
    }
  }
  
  //Return success message with OK-SKY responce format
  return(
    {
      //conversation_id : answer.context.conversation_id,
      intents,
      entities,
      talk,
      nodes_visited : answer.output.nodes_visited,
      response_context : answer.context,
      res_type : res_type,
      org_answer : answer.org_answer,
      ws : answer.ws,
    }
  );
}
module.exports.resultArrange = resultArrange;


/////////////////////////////////////////////////
/**
 * Bot talk convert
 * @param {*} answer
 * @param {unixtime} ut  
 * @param {date} dt 
 */
const convertBtalk = (answer, num) => {
  const dt = new Date()
  let ut = dt.getTime()
  return {
    mtime: ut + num,
    mtype: "bot",
    talk : answer.talk,
    response_context : answer.response_context,
    cdt: dt,
  }
}
module.exports.convertBtalk = convertBtalk;


/////////////////////////////////////////////////
/**
 * Arrange responded
 * responded is used for response condition after exec.
 * @param {*} answer
 * @param {*} messages 
 * @param {*} num
 */
const responded = (answer, messages, num) => {
  const responded = {
    org_answer : answer[0].org_answer,
    intents : answer[0].intents,
    entities : answer[0].entities,
    response_context : answer[0].response_context,
    nodes_visited : answer[0].nodes_visited,
  }
  
  const btalk = {
    type : "API",
    status_code : code.SUCCESS_ZERO,
    status_msg : status.SUCCESS_ZERO,
    qty: num,
    messages,
  }
  return {
    responded : responded,
    btalk_type : answer[0].btalk_type,
    btalk,
  }
}
module.exports.responded = responded;