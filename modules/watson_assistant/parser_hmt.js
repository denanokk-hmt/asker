'use strict'

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const {getRequestSLZ} = moduler.http
const getter = require(`${REQUIRE_PATH.modules}/linkage/asker/getter`)
const arranger = require(`./arranger`)


/**
 * ///////////////////////////////////////////////////
 * Watsonのレスポンスの結果を取得
 * @param {*} logiD
 * @param {*} answer 
 * @param {*} client 
 * @param {*} default_messages 
 */
const parseResponse = async (logiD, answer, client, default_messages) => {

  let results = []

  //Bwing仕様のJSON配列でレスポンスが設定されている場合
  if (Object.prototype.toString.call(answer.output.text[0]) === '[object Object]') {

    //ログ用オリジナルレスポンス
    answer.org_answer = answer.output.text[0].content.message  //contentのmessageを設定

    //Arrange response
    results.push(arranger.resultArrange(answer, 0));

  //文字列でのレスポンスが設定されている、またはレスポンス番号が設定されている場合  
  } else {

    //Rとハイフンつなぎの数値検索正規表現
    const exp = /R[0-9]+_*[0-9]+_*[0-9]*/;

    //ログ用オリジナルレスポンス
    answer.org_answer = answer.output.text[0]  //階層的複数メッセージは最上階のみ

    //外部連携を意識した文字列スプリットによる複数メッセージ(例 output.text[0]-->"R777_1|R77_2"-->length===1)
    //ダイアログで親子にある複数メッセージの分割への外部連携は、適用させない-->煩雑になりすぎる
    if (answer.output.text.length === 1) {
      if (String(answer.output.text[0]).match(exp)) {
        if (Object.prototype.toString.call(answer.output.text[0]) === '[object String]') {
          answer.output.text = answer.output.text[0].split('|')
        }
      }
    }

    //Arrangerでインテンツ、エンティティなどの結果を拾わせる
    //メッセージ分割のためのループ
    let talk
    for(let idx in answer.output.text) {
      //Linkage judge
      if (String(answer.output.text[idx]).match(exp)) {

        //Get Linkage response
        talk = await getter.getResponse(client, answer.output.text[idx], default_messages)
        answer.output.text[idx] = talk
      }
      //Arrange response
      results.push(arranger.resultArrange(answer, Number(idx)));
    }
  }

  return results
};

/**
 * ///////////////////////////////////////////////////
 * 最終整形
 * @param {*} logiD
 * @param {*} ctalk_quest {message, history, worth_words}
 * @param {*} answer 
 */
const arrangeForOutput = (logiD, ctalk_quest, answer, config) => {
  
  //Convert message for Bot talking
  let num = 0
  let messages = []
  for(let idx in answer) {
    messages.push(arranger.convertBtalk(answer[idx], ++num));
  }

  //Arrange responded
  let output = arranger.responded(answer, messages, num)

  //Logging 
  let logOutStr
  if (ctalk_quest.message != config['no_output_words']) {
    
    //Set for asker config value
    const quest = (ctalk_quest.history)? `${ctalk_quest.message}/${ctalk_quest.history}` : ctalk_quest.message
    const uuid = output.responded.response_context.uuid
    let org_answer = output.responded.org_answer.replace(/\|/g,',')
    org_answer = org_answer.replace(/\r?\n/g,"")
    let type_msg = []
    for (let i in output.btalk.messages) {
      type_msg[i] = `type:${output.btalk.messages[i].talk.type}-message:${output.btalk.messages[i].talk.content.message}`
    }
    const intents = JSON.stringify(output.responded.intents)
    const entities = logTrimer(output.responded.entities)
    logOutStr = `uuid:${uuid}|quest:${quest}|answer:${org_answer}|type-message:${JSON.stringify(type_msg)}|intents:${intents}|entities:${JSON.stringify(entities)}|WS:${answer[0].ws}`;

    //Convert entities to after triming entities
    output.responded.entities.confidence = entities.confidence
    output.responded.entities = entities

    //Set for keel config value
    let talk = []
    for (let i in output.btalk.messages) {
      talk[i] = output.btalk.messages[i].talk
    }
    output = {
      uuid,
      ...output,
      responded : {
        ...output.responded,
        quest : {
          item_name : ctalk_quest.history,
          item_value : ctalk_quest.message,
        },
        talk,
        ws : answer[0].ws,
      }
    }
  }
  
  return {
    status_code : code.SUCCESS_ZERO,
    output,
    logOutStr,
    worth_words : ctalk_quest.worth_words,
  }
}

/**
 * ///////////////////////////////////////////////////
 * Convert Btalk By Newest linkage response.
 * @param {*} logiD
 * @param {*} client
 * @param {*} answer 
 * @param {*} response { response, worth_words }
 */
const convertBtalkByNewest = async (logiD, client, answer, response) => {

  //Contition Newest sign & User Input text
  if (conf.sign_newest[client].indexOf(answer.org_answer) >= 0) {
    const params = {
      "client" : client,
      "version" : conf.version,
      "token" : conf.conf_newest.token,
      "text" : answer.org_answer,
      "logiD" : logiD,
      "worth_words" : response.worth_words,
    }

    const url_path = (!response.worth_words) ? 'newest' : 'worthwords'

    //Set newest server url: svc-hmt-newest.bwing.app/hmt/get/newest/response
    //Newest is multi. No need client-code in the url pass. not like keel url pass.
    const url = `https://${conf.domains_newest[client]}/${conf.env.routes.url_api}/get/${url_path}/response`
    //const url = `http://localhost:8089/${conf.env.routes.url_api}/get/${url_path}/response`
  
    const newest = await getRequestSLZ(url, params, response => {
      return response.data
    })
    .catch(err => {
      throw new Error(err)
    })    

    //Convert btalk
    if (newest.answer) {
      response.output.btalk = newest.answer.btalk
    }
  }
  return response
}

/**
 * ///////////////////////////////////////////////////
 * Parse for WhatYa
 * @param {*} logiD
 * @param {*} client
 * @param {*} ctalk_quest {message, history, worth_words}
 * @param {*} answer
 */
const parser = async (logiD, client, ctalk_quest, answer, state) => {

  const config = await getter.config(client)
  const default_messages = await getter.defaultMessages(client)

  if (answer.output.text.length == 0) {
    answer.output.text.push("")
  }

  return await parseResponse(logiD, answer, client, default_messages)
    .then(results => {
      return arrangeForOutput(logiD, ctalk_quest, results, config)
    })
    .then(results => {
      return convertBtalkByNewest(logiD, client, answer, results)
    })
    .catch(err => {
      throw new Error(err)
  });
}
module.exports.func = parser

/**
 * ///////////////////////////////////////////////////
 * Parse for p1 log triming to entities.
 * @param {*} responded
 */
function logTrimer(responded){

  let values = []
  let confidence_cnt = 0
  for (let idx in responded.entities) {
    if (responded.entities[idx].value != 'NN') {
      values.push(responded.entities[idx])
      confidence_cnt++
    }
  }

  return {
    confidence : confidence_cnt,
    entities : values
  }
}
