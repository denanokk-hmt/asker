'use strict';

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
const adf = require(`${REQUIRE_PATH.modules}/api_default_func`).apiDefaultFunc
const valid = moduler.validation
const crypto = moduler.crypto
const logger = require(`${REQUIRE_PATH.modules}/log`)
const ai_module = require(`${REQUIRE_PATH.modules}/${conf.conversationAPI}/api`)

//route modules
const getAsker = require(`./asker/get_asker`)
const postAsker = require(`./asker/post_asker`)


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
 * Basic validation (Is value & Version)
 * @param {*} res
 * @param {*} params
 */
function basicValidation(res, params) {

  //Validation IsValue
  let valid_result
  valid_result = valid.isParamValue(params)
  if (!valid_result.approval) {
    express_res.funcErr(res, valid_result.status_msg, valid_result.status_code);
    return 'IsValue valid error.'
  }

  //Validation Version auth
  valid_result = valid.versionAuth(params.version)
  if (!valid_result.approval) {
    express_res.funcErr(res, valid_result.status_msg, valid_result.status_code);
    return 'Version valid error.'
  }

}

/**
 * ///////////////////////////////////////////////////
 * [[[For Developement]]]
 * Get Node process env
 */
router.get('/get/env', adf.firstSet, adf.loggingParams, async (req, res, next) => {
  let result = process.env
  result.node_version = process.version
  res.end(JSON.stringify(result));
})

/**
 * ///////////////////////////////////////////////////
 * Get config
 */
router.get('/get/config', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //Parameter
  let params = {
    version: req.query.version,
    token: req.query.token,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Token validation
  const valid_result = valid.tokenAuthKeel(params.token)
  if (!valid_result.approval) {
    express_res.funcErr(res, valid_result.status_msg, valid_result.status_code);
    return 'Token valid error.'
  }

  //Response configures
  express_res.func(res, conf)

  return true
})

/**
 * ///////////////////////////////////////////////////
 * [[[For Developement]]]
 * Issue Token
 */
router.get('/get/token', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  const params = {
    client : req.query.client,
    version : req.query.version,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Validation IsValue
  let valid_result
  valid_result = valid.isParamValue(params)
  if (!valid_result.approval) {
    express_res.funcErr(res, valid_result.status_msg, valid_result.status_code);
    return 'IsValue valid error.'
  }

  //Hash token made from id & pw
  const hashIdPw = await crypto.hashMac(params.id, params.pw)
  if (!hashIdPw.issue) {
    express_res.funcErr(res, hashIdPw.status_msg, hashIdPw.status_code);
    return 'Token issue Error.';
  }

  //Create random seed 8
  const seed = (req.query.seed)? req.query.seed : crypto.seedRandom8()

  //Encrypt from seed & hashIdPw.token 
  console.log(`${seed}${hashIdPw.token}`)
  const encrypt = crypto.encrypt(`${seed}${hashIdPw.token}`)
  if (!encrypt.issue) {
    express_res.funcErr(res, encrypt.status_msg, encrypt.status_code);
    return 'Encrypt error'  
  }

  res.end(JSON.stringify(encrypt));
})

/**
 * ///////////////////////////////////////////////////
 * Check Asker answers
 */
router.get('/get/asker/answers', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  let params = {
    client : req.query.client,
    version : req.query.version,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Answers
  const answers = await getAsker.answers(req, res)
  .catch(err => {
    errHandle2Top(err, next)
    return 'get asker asnwers error'
  });

  express_res.func(res, answers)
})

/**
 * ///////////////////////////////////////////////////
 * Check Asker credential
 */
router.get('/get/asker/credentials', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  let params = {
    client : req.query.client,
    version : req.query.version,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //credentials
  const credentials = await getAsker.credentials(req, res)
  .catch(err => {
    errHandle2Top(err, next)
    return 'get asker credentials error'
  });

  express_res.func(res, credentials)
})

/**
 * ///////////////////////////////////////////////////
 * Check Asker config
 */
router.get('/get/asker/config', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  //parameter
  let params = {
    client : req.query.client,
    version : req.query.version,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //config
  const config = await getAsker.config(req, res)
  .catch(err => {
    errHandle2Top(err, next)
    return 'get asker config error'
  });

  express_res.func(res, config)
})

/**
 * ///////////////////////////////////////////////////
 * [OLD] [NO USE] Update Asker answers instance
 */
router.get('/get/asker/answers/update', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  const logiD = req.logiD

  //parameter
  const params = {
    client : req.query.client,
    version : req.query.version,
    token : req.query.token,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Token auth with Keel
  const valid_result = valid.tokenAuthKeel(params.token)
  if (!valid_result.approval) {
    express_res.funcErr(res, valid_result.status_msg, valid_result.status_code);
    return 'Token valid error.'
  }

  //Update Asker answers
  getAsker.updateAnswers(req, res, logiD)
  .catch(err => {
    errHandle2Top(err, next)
    return 'Asker answers update error'
  });

})

/**
 * ///////////////////////////////////////////////////
 *  [OLD] [NO USE] Update Asker response
 * [for development or examination]
 * Usually use boarding API(/get/asker/response/update)
 */
router.get('/get/asker/response/update', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  const logiD = req.logiD

  //parameter
  const params = {
    client : req.query.client,
    version : req.query.version,
    token : req.query.token,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Token auth with Keel
  const valid_result = valid.tokenAuthKeel(params.token)
  if (!valid_result.approval) {
    express_res.funcErr(res, valid_result.status_msg, valid_result.status_code);
    return 'Token valid error.'
  }

  //Update Asker answers
  getAsker.updateResponse(req, res, logiD)
  .catch(err => {
    errHandle2Top(err, next)
    return 'asker response update error.'
  });

})

/**
 * ///////////////////////////////////////////////////
 * Delete Asker answers(no need?)
 */
router.get('/get/asker/answers/delete', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  const logiD = req.logiD

  //parameter
  const params = {
    client : req.query.client,
    version : req.query.version,
    token : req.query.token,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Token auth client
  const valid_result = valid.tokenAuthClient(params.client, params.token)
  if (!valid_result.approval) {
    express_res.funcErr(res, valid_result.status_msg, valid_result.status_code);
    return 'Token valid error.'
  }

  //Delete Asker answers
  getAsker.deleteAnswers(req, res, logiD)
  .catch(err => {
    errHandle2Top(err, next)
    return 'Asker answers delete error'
  });
})

/**
 * ///////////////////////////////////////////////////
 * Update Asker answers
 */
router.post('/post/asker/answers/update', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  const logiD = req.logiD

  //parameter
  const params = {
    client : req.body.client,
    version : req.body.version,
    token : req.body.token,
    credentials : req.body.credentials,
    config : req.body.config,
    default_messages : req.body.default_messages,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Token auth with Keel
  const valid_result = valid.tokenAuthKeel(params.token)
  if (!valid_result.approval) {
    express_res.funcErr(res, valid_result.status_msg, valid_result.status_code);
    return 'Token valid error.'
  }

  //Update Asker answers
  postAsker.updateAnswers(req, res, logiD)
  .catch(err => {
    errHandle2Top(err, next)
    return 'Asker answers update error'
  });

})


/**
 * ///////////////////////////////////////////////////
 * Update Asker response
 * [for development or examination]
 * Usually use boarding API(/post/asker/response/update)
 */
router.post('/post/asker/response/update', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  const logiD = req.logiD
  console.log(`======${logiD} ASKER RESPONSE UPDATE BATCH_ID: ${req.body.batch_id}, RESPONSE ROWS: ${JSON.parse(req.body.response).length}`)

  //parameter
  const params = {
    client : req.body.client,
    version : req.body.version,
    token : req.body.token,
    response : req.body.response,
  }

  //Basic validation
  const result = basicValidation(res, params);
  if (result) {
    return result
  }

  //Token auth with Keel
  const valid_result = valid.tokenAuthKeel(params.token)
  if (!valid_result.approval) {
    express_res.funcErr(res, valid_result.status_msg, valid_result.status_code);
    return 'Token valid error.'
  }

  //Update Asker answers
  postAsker.updateResponse(req, res, logiD)
  .catch(err => {
    errHandle2Top(err, next)
    return 'asker response update error.'
  });

})

/**
 * ///////////////////////////////////////////////////
 * Get Asker answers response
 */
router.get('/get/asker/answers/response', adf.firstSet, adf.loggingParams, async (req, res, next) => {

  const logiD = req.logiD

  //parameter
  const ctalk_quest = req.query.ctalk_quest.replace(/[\n\r\t]/g, " ")
  let params = {
    client : req.query.client,
    version : req.query.version,
    token : req.query.token,
    method : req.query.method,
    tag : (req.query.tag)? req.query.tag : 'all',
    ctalk_quest : {
      message : ctalk_quest,
      worth_words : req.query.worth_words,
    },
    quest: ctalk_quest //for is
  }

  //Basic validation
  let valid_result = basicValidation(res, params);
  if (valid_result) {
    return valid_result
  }

  //Token auth client
  valid_result = valid.tokenAuthKeel(params.token)
  if (!valid_result.approval) {
    express_res.funcErr(res, valid_result.status_msg, valid_result.status_code);
    return 'Token valid error.'
  }

  //Get Settings from array
  const answers = await getAsker.answers(req, res, logiD)
  const credentials = await getAsker.credentials(req, res, logiD)
  const config = await getAsker.config(req, res, logiD)

  //Len check
  valid_result = valid.len(config, params.ctalk_quest.message, params.client)
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

  //Result
  let result
  if (response) {

    //Log output
    logger.system(`[INFO]|[${params.client}]|logiD:${logiD}`,response.logOutStr, true, false);

    //init_op no message care
    if (params.ctalk_quest.message === 'init_op') {
      if (response.output.btalk.messages.length == 1 && !response.output.btalk.messages[0].talk.content.message) {
        response.output.btalk.status_msg = "Zero messages."
        response.output.btalk.qty = 0
        response.output.btalk.mtime = response.output.btalk.messages[0].mtime
        response.output.btalk.messages = []
      }
    }
    result = {
      type : "SYSTEM",
      status_code : code.SUCCESS_ZERO,
      status_msg : status.SUCCESS_ZERO,
      approval : true,
      answer : response,
    }

  } else {
    result = {
      type : "SYSTEM",
      status_code : code.ERR_A_SYSTEM_990,
      status_msg : status.ERR_A_SYSTEM_990,
      approval : false,
      answer : 'no response',
    }
  }

  //Response
  express_res.func(res, result)
  
  return
})

module.exports = router;
