'use strict';

const dateformat = require('dateformat');

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code
const status = conf.status

//express
var express = require('express')
var router = express.Router()
const express_res = conf.express_res

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System module
const valid = moduler.validation
const crypto = moduler.crypto
const logger = require(`${REQUIRE_PATH.modules}/log`)
const ai_module = require(`${REQUIRE_PATH.modules}/${conf.conversationAPI}/api`)
const getAsker = require(`./asker/get_asker`)


/**
 * ///////////////////////////////////////////////////
 * Error Response
 * @param {*} err 
 * @param {*} next 
 */
function errHandle2Top(err, next) {
  const result = {
    type: "API",
    status_code: code.ERR_S_API_REQ_902,
    status_msg : status.ERR_S_API_REQ_902,
    approval: false,
    status: err.status,
    message: err.message,
    stack: err.stack,
  }
  next(result)
}

/**
 * ///////////////////////////////////////////////////
 * WNC CCQA connection
 */
router.get('/:client/search-answer', async function(req, res, next) {

  const logiD = `${crypto.seedRandom8()}${(new Date).getTime()}`
  const logDate = logiD + dateformat(new Date(), 'yyyymmdd-HH:MM:ss:l');

  console.log(`=========GET WNC CCQA CONNECT ${logiD} ===========`, JSON.stringify(req.query))

  //parameter
  const params = {
    client : req.params.client,
    method : 'get_quest',
    tag : 'all',
    ctalk_quest : { message : req.query.text },
    quest: req.query.text,
  }

  //Another setting
  const req_url = decodeURIComponent(req.originalUrl);
  req.query.client = params.client

  //Get Settings from array
  const answers = await getAsker.answers(req, res, logiD)
  const credentials = await getAsker.credentials(req, res, logiD)
  const config = await getAsker.config(req, res, logiD)

  //Len check
  const valid_result = valid.len(config, params.ctalk_quest.message, params.client)
  if (!valid_result.approval) {
    express_res.funcErr(res, valid_result.status_msg, valid_result.status_code);
    return 'len valid error.'
  }

  //Add other params( response context & ws target no...)
  params.res_context = (req.query.res_context)? req.query.res_context : { response_context: '', }
  params.ws_no = req.query.ws_no
  params.ctalk_quest.history = req.query.ctalk_history
  
  //AI QA
  let api = []
  let cnt = 0
  for (let idx in answers) {

    //Backward compatible(後方互換のために  tagが完全にない→allとenvironmentを追加)
    if (!credentials[idx].tag) { credentials[idx]['tag'] =  ['all', conf.env.environment] }
    //force ws instatnce setting
    if (params.ws_no) { idx = params.ws_no }

    //check method, tag
    let check = true
    if (credentials[idx].method.indexOf(params.method) < 0) {
      check = false
    } else if (credentials[idx].tag.indexOf(params.tag) < 0) {
      check = false
    } else if (credentials[idx].tag.indexOf(conf.env.environment) < 0) {
      check = false
    }

    //Quest to conversation API
    if (check) {
      api[cnt] = ai_module.func(logiD, params.client, answers[idx], credentials[idx], config, params.ctalk_quest, params.res_context)
      .catch(err => {
        let kind
        if (err.message.match(/Timeout/i)) {
          kind = 'WatsonAssistant timeout error.'
        } else {
          kind = 'WatsonAssistant api error.'
        }
        const err_obj = {
          err : kind,
          logiD : logiD,
          client : params.client,
          msg : err.message
        }
        console.error(JSON.stringify(err_obj))
        errHandle2Top(err, next)
        throw 'watson error.'
      });
      cnt++
    }
  }

  //1st response only 
  if (res.finished) return

  //AI Manner
  //faster_faster is Reply 1st answer.
  //compare_results is Reply 1st correct answer or not understand.
  //compare_confidece is Reply highest condidence. 
  let response
  try {
    switch (config.manner) {
      case 'compare_results' :
        response = await Promise.all(api).then(results => { 
          let confidence = [0, 0]
          let idx
          for (idx in results) {
            let output = results[idx].output
            let anything_else_flg = (output.responded.nodes_visited.slice(-1)[0] == 'その他')? true : false
            if (!anything_else_flg) {
              confidence[0] = (!output.responded.intents)? 0 : output.responded.intents.confidence
              confidence[1] = (!output.responded.entities)? 0 : output.responded.entities.confidence
              if (confidence[0] + confidence[1] > 0) {
                return results[idx]
              }
            }
          }
          return results[idx]
        });
        break;
      case 'compare_confidece' :
        response = await Promise.all(api).then(results => {
          let confidence = [0, 0]
          let sum_confidece
          let buff_confidence = 0
          let buff_idx
          for (let idx in results) {
            let output = results[idx].output
            if (output.responded.nodes_visited.slice(-1)[0] == 'その他') {
              sum_confidece = 0
            } else {
              confidence[0] = (!output.responded.intents)? 0 : output.responded.intents.confidence
              confidence[1] = (!output.responded.entities)? 0 : output.responded.entities.confidence
              sum_confidece = confidence[0] + confidence[1]
            }
            if (buff_confidence <= sum_confidece) {
              buff_confidence = sum_confidece
              buff_idx = idx
            }
          }
          return results[buff_idx]
        })
        break;
      case 'faster_faster' :
      default :
        response = await Promise.race(api).then(results => { 
          return results
        });
    }
  } catch(err) {
    return err
  }

  //Response
  let result
  if (response) {

    const quest = response.output.responded.quest.item_value
    const result_text = response.output.responded.org_answer
    const intents = (response.output.responded.intents.intents.length == 0)? 'nothing' : response.output.responded.intents.intents[0].intent
    const entities = (response.output.responded.entities.entities.length == 0)? 'nothing' : response.output.responded.entities.entities[0].entity
    const ws = response.output.responded.ws
    const confidence = [ response.output.responded.intents.confidence, response.output.responded.entities.confidence ]
    const conversation_id = response.output.responded.response_context.conversation_id

    //Log output(V1 style log)
    logger.system(`[INFO]|[${params.client}]|logiD:${logiD}`,response.logOutStr, true, false);

    //old style(WNC styke log)
    const logOutStr = `quest:${quest}|answer:${result_text}|intents:${intents}|entities:${entities}|WS:${ws}`;
    logger.system(logOutStr, conf.env.log_stdout, false, logDate);
      
    //new style
    const body = {
      type: "INFO",
      client: params.client,
      service: 'WNC',
      uuid: null,
      rid: null,
      uid: null,
      responded : {
        entities: {
          confidence: confidence[1],
          entities: [{
            confidence: confidence[1],
            entity: entities,
          }]
        },
        intents: {
          confidence: confidence[0],
          intents: [{
            confidence: confidence[0],
            intent: intents,    
          }]
        },
        org_answer: result_text,
        quest: {
          item_name: quest,  
          item_value: quest,     
        },
        talk: [{
          type: "text",
          content: { message: result_text },
        }],
        ws: ws
        }   
    }
    logger.systemJSON("INFO", body, conf.env.log_stdout, false);

    result = {
      searcher_id: conversation_id,
      url: req_url,
      text: quest,
      answer_list: [
        {
          answer: result_text,
          intents: intents,
          entities: entities,
          cos_similarity: 0.8,
          confidence: confidence,
          answer_altered: true,
          question: null,
          WS:ws
        }
      ]
    }

  } else {
    result = {
      searcher_id: null,
      url: req_url,
      text: params.quest,
      answer_list: [
        {
          answer: 'Watson Assistant error',
          intents: 'Watson Assistant error',
          entities: 'Watson Assistant error',
          cos_similarity: 0.8,
          confidence: [0, 0],
          answer_altered: true,
          question: null,
          WS: null
        }
      ]
    }
  }

  express_res.func(res, result)
  
  return
})

module.exports = router;