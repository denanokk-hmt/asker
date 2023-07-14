'use strict';

//config
const conf = require(REQUIRE_PATH.configure);
const spreadsheet_conf = conf.asker_sheet_config

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System module
const ds_conf = moduler.kvs;
const spreadsheet = require(`./google/spreadsheet-reader`)
const answers_parser = require(`${REQUIRE_PATH.modules}/${conf.conversationAPI}/answers_parser`)
const ai_instance = require(`${REQUIRE_PATH.modules}/${conf.conversationAPI}/ai_instance`)

//Instances
const instances = require(`./instances`)
let answers = instances.answers;
let answers_credentials = instances.answers_credentials;
let answers_config = instances.answers_config;
let answers_default_messages = instances.answers_default_messages;


//////////////////////////////////////////////////
/**
 * Initialize set server hostname to storage
 * @param {*} hostname 
 * @param {*} server_code 
 */
const initialSetHostname = async (hostname) => {

  //Old server code care
  //and old stagong server code with environment to end. like a "svc".
  const server_code = conf.server_code.replace(/stg$/, '')
  
  //Set namespace
  const ns = `${conf.env.kvs.service}-${server_code}-${conf.env.environment}`

  console.log(`====ASKER HOSTNAME UPDATE TO DS ns:${ns} hostname:${hostname} ====`)

  //Get hostnames(onlu update is true entities)
  const hostnames = await ds_conf.hostnames.get(ns, server_code, true)
  .catch(err =>{
    throw new Error(err)
  })

  //Delete hostname(onlu update is true entities)
  for(let idx in hostnames) {
    if (hostnames[idx].commit_id != conf.commit_id) {
      await ds_conf.hostnames.delete(ns, hostnames[idx].hostname)
      .catch(err =>{
        throw new Error(err)
      })
    }
  }

  //Insert hostname
  await ds_conf.hostnames.insert(ns, server_code, hostname, conf.commit_id)
  .catch(err =>{
    throw new Error(err)
  })

  console.log(`=========ASKER HOSTNAME GOT IT !! ${hostname}===========`)

  return new Date();
}
module.exports.initial = initialSetHostname;

//////////////////////////////////////////////////
/**
 * Instance asker answers
 * @param {*} client
 */
const instanceAnswers = async (client) => {

  console.log(`======== INSTANCE ANSWERS ${client} ========`)

  //Set namespace
  const namespace = `${conf.env.kvs.service}-${client}-${conf.env.environment}`

  //Get Answers infomation(Ai instance, credentials, configs, default messages) from DS 
  answers[client] = await ds_conf.answers.getAnswers(namespace, client) //Get answers
  .then(results => {

    console.log(`========DS Answers ns: ${namespace} answers:${results.length}`)

    //care no credential client
    if (results.length == 0) {
      answers_credentials[client] = []
      answers_config[client] = []
      answers_default_messages[client]
      return
    }

    //parse & set credential
    let credentials = []
    for (let idx in results) {
      credentials[results[idx].answer_id] = answers_parser.credential(JSON.parse(results[idx].credentials))  //parse credentials
    }
    answers_credentials[client] = credentials //set credentials
    
    //parse & set config
    answers_config[client] = answers_parser.config(JSON.parse(results[0].config))

    //parse & set default messages
    answers_default_messages[client] = answers_parser.defaultMessages(JSON.parse(results[0].default_messages))
    
    return credentials
  })
  .then(results => {
    
    //Instance AI
    if (results) return ai_instance.func(results, client)
  })
  .catch(err =>{
    throw new Error(err)
  })

  return answers_credentials[client]
};
module.exports.instanceAnswers = instanceAnswers;

//////////////////////////////////////////////////
/**
 * Delete asker answers
 * @param {*} client
 */
const deleteAnswers = async (client, logiD) => {
  answers_credentials[client] = []
  answers_config[client] = []
  answers_default_messages[client] = []
};
module.exports.deleteAnswers = deleteAnswers;

//////////////////////////////////////////////////
/**
 * Get answers
 * @param {*} client 
 */
const getAnswers = async (client, logiD) => {
  if (answers[client]) {
    return answers[client]
  } else {
    throw new Error(`${logiD} ${client} do not has instance.`)
  }
};
module.exports.answers = getAnswers;


//////////////////////////////////////////////////
/**
 * Get answers credential
 * @param {*} client 
 */
const getAnswersCredentials = async (client, logiD) => {
  if (answers_credentials[client]) {
    return answers_credentials[client]
  } else {
    throw new Error(`${client} do not has credential.`)
  }
};
module.exports.credentials = getAnswersCredentials;


//////////////////////////////////////////////////
/**
 * Get answers config
 * @param {*} client 
 */
const getAnswersConfig = async (client, logiD) => {
  if (answers_config[client]) {
    return answers_config[client]
  } else {
    throw new Error(`${client} do not has config.`)
  }
};
module.exports.config = getAnswersConfig;


//////////////////////////////////////////////////
/**
 * Get answers config
 * @param {*} client 
 */
const getAnswersDefaultMessages = async (client, logiD) => {
  if (answers_default_messages[client]) {
    return answers_default_messages[client]
  } else {
    throw new Error(`${client} do not has efault messages.`)
  }
};
module.exports.defaultMessages = getAnswersDefaultMessages;

//////////////////////////////////////////////////
/**
 * Get Answers response
 * @param {*} client 
 * @param {*} response_id 
 * @param {*} default_messages
 */
const getResponse = async (client, response_id, default_messages) => {

  //Set namespace : do not use config namespace : ds_conf.NAMESPACE
  const namespace = `${conf.env.kvs.service}-${client}-${conf.env.environment}`

  //Get responsies for Datastore
  //let response = [] 
  //response = {talk : {type:"text",content : {message:TEXT"}}}
  const response = await ds_conf.responsies.getResponse(namespace, client, response_id)
  .catch(err =>{
    throw new Error(err)
  })

  if (response.length) {
    const talk = JSON.parse(response[0].talk)
    return {
      type : talk.type,
      content : talk.content,
      eventLog: talk.eventLog,
    }
  } else {
    return {
      type : "text",
      content : {
        message : default_messages['data_linkage_error'],
      }
    }    
  } 
};
module.exports.getResponse = getResponse;

//////////////////////////////////////////////////
/**
 * [OLD][NO USE] Update response
 * @param {*} client
 */
const updateResponse = async (client) => {
  console.log(`=========ASKER RESPONSE UPDATE GET SPREADSHEET ${client}===========`)

  //Get responsies
  const range = spreadsheet_conf[client].response.range
  const data = await spreadsheet.funcResponse(client, spreadsheet_conf[client].response.id, range[0])
  .then(results => {
    return results
  })
  .catch(err => {
    throw new Error(err)
  });

  console.log(`=========ASKER RESPONSE UPDATE INSERT TO DS ${client}===========`)

  //Set namespace : do not use config namespace : ds_conf.NAMESPACE
  const namespace = `${conf.env.kvs.service}-${client}-${conf.env.environment}`

  //Get responsies
  const response = await ds_conf.responsies.getResponsies(namespace, client)
  .catch(err =>{
    throw new Error(err)
  })

  //Delete  response
  if (response.length) {
    await ds_conf.responsies.deleteResponseByAll(namespace)
    .catch(err =>{
      throw new Error(err)
    })
  }

  //Insert newest response
  try {
    for(let idx in data) {
      ds_conf.responsies.insertResponse(namespace, client, idx, JSON.stringify(data[idx]))
    }
  } catch(err) {
    throw new Error(err)
  }

  return true;
}
module.exports.updateResponse = updateResponse;

//////////////////////////////////////////////////
/**
 * [OLD][NO USE] Update asker answers
 * [exec contents 1-->2-->3]
 *  1. Get Answers infomation(credentials, config, default messages) from Spread sheet
 *  2. insert Answers infomation to datastore.
 *  3. Then ai instance replace.
 *  Api call(/get/asker/answers/update)
 * @param {*} client
 */
const updateAnswers = async (client, logiD) => {

  console.log(`====${logiD} ANSWERS UPDATE & RE INSTACE AI ${conf.server_code} order from: ${client}====`)

  //Old server code care
  //and old stagong server code with environment to end. like a "svc".
  const server_code = conf.server_code.replace(/stg$/, '') 
  
  ///////////////////////
  //Get answers config from spreadsheets

  //Get answers credentials
  const credentials_item = ['method', 'environment', 'workspace_id', 'username', 'password', 'url', 'tag']
  let cnt = 1
  let idx0 = 0
  let result = []
  let credentials = []
  let range = spreadsheet_conf[client].credentials.range
  for (let idx1 in range) {
    let results = await spreadsheet.funcAnswers(spreadsheet_conf[client].credentials.id, range[idx1])
    .catch(err => {
      throw new Error(err)
    });
    //Divide
    for (let idx2 in results) {
      cnt++
      result.push(results[idx2])
      if (cnt > credentials_item.length) {
        credentials[idx0] = result
        cnt = 1
        result = []
        idx0++
      }
    }
  }
  //parse & set credential
  let parse_credentials = []
  let ds_insert_credentials = []
  for (let idx in credentials) {
    let values = answers_parser.credential(credentials[idx])  //parse credentials
    if (values) {
      parse_credentials[idx] = values
      ds_insert_credentials.push(credentials[idx])
    }
  }
  answers_credentials[client] = parse_credentials //set credentials
  console.log(`====${logiD} GOT CREDENTIALS.`)

  
  //Get answers config
  let config = []
  range = []
  range = spreadsheet_conf[client].config.range
  for (let idx in range) {
    config[idx] = await spreadsheet.funcAnswers(spreadsheet_conf[client].config.id, range[idx])
    .catch(err => {
      throw new Error(err)
    });
  }
  console.log(`====${logiD} GOT ANSWERS CONFIG.`)

  //Get answers config
  let default_messages = []
  range = []
  range = spreadsheet_conf[client].default_messages.range
  for (let idx in range) {
    default_messages[idx] = await spreadsheet.funcAnswers(spreadsheet_conf[client].default_messages.id, range[idx])
    .catch(err => {
      throw new Error(err)
    });
  }
  console.log(`====${logiD} GOT ANSWERS DEFAULT MESSAGES.`)

  
  ///////////////////////
  //Set answers configs to DS

  //Set namespace
  const ns_answers = `${conf.env.kvs.service}-${client}-${conf.env.environment}`

  //Get answers
  const answers = await ds_conf.answers.getAnswers(ns_answers, client)
  .catch(err =>{
    throw new Error(err)
  })

  //Delete answers
  for(let idx in answers) {
    if (answers[idx]) {
      await ds_conf.answers.deleteAnswer(ns_answers, answers[idx].answer_id)
      .catch(err =>{
        throw new Error(err)
      })
    }
  }

  //Insert answer
  for(let idx in ds_insert_credentials) {
    await ds_conf.answers.insertAnswer(ns_answers, client, idx, JSON.stringify(ds_insert_credentials[idx]), JSON.stringify(config[0]), JSON.stringify(default_messages[0]))
    .catch(err =>{
      throw new Error(err)
    })
  }
  

  ///////////////////////
  //Instance answers by new configs
  await instanceAnswers(client)
  .catch(err =>{
    throw new Error(err)
  })


  ///////////////////////
  //Set hostname to ds

  //Set namespace
  const ns_hostnames = `${conf.env.kvs.service}-${server_code}-${conf.env.environment}`

  //Upate hostnames update flag(false-->true)
  await ds_conf.hostnames.insert(ns_hostnames, server_code, process.env.HOSTNAME, conf.commit_id, true)
  .catch(err =>{
    throw new Error(err)
  })

  return new Date();
}
module.exports.updateAnswers = updateAnswers;