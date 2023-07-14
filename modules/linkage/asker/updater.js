'use strict';

//config
const conf = require(REQUIRE_PATH.configure);

//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System module
const ds_conf = moduler.kvs;
const answers_parser = require(`${REQUIRE_PATH.modules}/${conf.conversationAPI}/answers_parser`)
const parser = require(`${REQUIRE_PATH.modules}/linkage/csv/parser`)


//////////////////////////////////////////////////
/**
 * Update asker answers
 *  1. Get Answers infomation(credentials, config, default messages) from Spread sheet post data
 *  2. insert Answers infomation to datastore.
 * @param {*} client
 */
const updateAnswers = async (req, logiD) => {
  
  const client = req.body.client
  console.log(`=========${logiD} ASKER ANSWERS UPDATE ${client}===========`)

  //Server code
  const server_code = conf.server_code
  
  ///////////////////////
  //Get answers config from spreadsheets

  //Get answers credentials
  const credentials_item = ['method', 'environment', 'workspace_id', 'username', 'password', 'url', 'tag']
  let cnt = 1
  let idx0 = 0
  let result = []
  let credentials = []

  //Get credentials sheet data
  let gas_credentials_sheet = JSON.parse(req.body.credentials)
  if(gas_credentials_sheet.length === 0){
    throw new Error(`Credentials are empty.`)
  }

  //remove empty spaces from nested array
  let results = gas_credentials_sheet.map(credential_row => 
    credential_row.filter(row_val => {return row_val != null && row_val != ''}))

  //Divide
  for (let idx in results) {
    cnt++
    result.push(results[idx])
    if (cnt > credentials_item.length) {
      credentials[idx0] = result
      cnt = 1
      result = []
      idx0++
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

  //Get config sheet data
  let gas_config_sheet = JSON.parse(req.body.config);
  if(gas_config_sheet.length === 0){
    throw new Error(`Config is empty.`)
  }

  //remove empty spaces from nested array
  let config = gas_config_sheet.map(config_row => 
    config_row.filter(row_val => {return row_val != null && row_val != ''}));

  //convert conf values to string
  let ds_config = config.map(row => {
    if(row[1] && typeof row[1] !== "string") return [row[0], String(row[1])]
    return row
  });

  //Get default_messages sheet
  let gas_default_messages_sheet = JSON.parse(req.body.default_messages);
  if(gas_default_messages_sheet.length === 0){
    throw new Error(`Default_messages are empty.`)
  }

  //remove empty spaces from nested array
  let default_messages = gas_default_messages_sheet.map(default_message_row => 
    default_message_row.filter(row_val => {return row_val != null && row_val != ''}));

  ///////////////////////
  //Set answers configs to DS
  const ns_answers = `${conf.env.kvs.service}-${client}-${conf.env.environment}`
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
  console.log(`===========${logiD}  ASKER ANSWERS INSERT =========== ${ns_answers}`)
  for(let idx in ds_insert_credentials) {
    await ds_conf.answers.insertAnswer(ns_answers, client, idx, JSON.stringify(ds_insert_credentials[idx]), JSON.stringify(ds_config), JSON.stringify(default_messages))
    .catch(err =>{
      throw new Error(err)
    })
  }

  ///////////////////////
  //Upate hostnames update flag(false-->true)
  const ns_hostnames = `${conf.env.kvs.service}-${server_code}-${conf.env.environment}`
  console.log(`===========${logiD}  ASKER HOSTNAMES INSERT =========== ${ns_hostnames}`)
  await ds_conf.hostnames.insert(ns_hostnames, server_code, process.env.HOSTNAME, conf.commit_id, true)
  .catch(err =>{
    throw new Error(err)
  })

  return new Date();
}
module.exports.updateAnswers = updateAnswers;



//////////////////////////////////////////////////
/**
 * Update response
 * @param {*} client
 */
const updateResponse = async (req, logiD) => {
  
  const client = req.body.client;
  console.log(`=========${logiD} ASKER RESPONSE UPDATE ${client}===========`)

  //Get responses coming from
  let gas_response = JSON.parse(req.body.response);
  let response_data = {}
  if (gas_response.length) {
    response_data[client] = parser.parseData(gas_response)
  } else {
    console.log('No data found.');
    throw new Error('No data found.')
  }

  //Set namespace : do not use config namespace : ds_conf.NAMESPACE
  const namespace = `${conf.env.kvs.service}-${client}-${conf.env.environment}`

  //Insert newest response
  let insert_row = 0;
  let insert = []
  let result

  console.log(`===========${logiD} ASKER RESPONSE INSERT =========== ${namespace}`)
  try {
    for(let idx in response_data[client]) {
      insert[insert_row++] = await ds_conf.responsies.insertResponse(namespace, client, idx, JSON.stringify(response_data[client][idx]), req.body.batch_id)
    }
    result = await Promise.all(insert).then(insert => {
      return insert.length
    });      
  } catch(err) {
    throw new Error(err)
  }

  return result;
}
module.exports.updateResponse = updateResponse;