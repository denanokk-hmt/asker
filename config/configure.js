'use strict';

//System modules
const { getRequest } = require(`${REQUIRE_PATH.moduler}/stand_alone`).wakeup('http')


/**
 * Set configure
 * @param args {*} {  
 * @param {*} appli_name 
 * @param {*} server_code 
 * @param {*} environment
 * } 
 */
const configuration = async (args) => {

  /////////////////////////
  //Set basic server configs

  //NODE ENV
  const hostname = process.env.HOSTNAME
  console.log(`hostname:${hostname}`)

  //Direcotry pass
  const dirpath =(process.env.NODE_ENV == 'prd')? '/home/dev' : '.'
  module.exports.dirpath = dirpath

  //express response common
  const express_res = require(`../routes/express_res`);
  module.exports.express_res = express_res

  //Application name
  const appli_name = args.appli_name
  module.exports.appli_name = appli_name

  //Server code
  const server_code = args.server_code
  module.exports.server_code = server_code

  //Depoy environmebt
  const environment = args.environment
  module.exports.environment = environment

  //short sha commit id
  const sha_commit_id = process.env.SHA_COMMIT_ID || null;

  //deploy stamp
  const deploy_unixtime = process.env.DEPLOY_UNIXTIME || 0;

  //restart stamp
  const restart_unixtime = process.env.RESTART_UNIXTIME || 0;

  //Set commitid
  //restart is grater than deploy_unixtime --> Restart, using latest revisions :: [sha_commit_id]_[restart_unixtime]
  //Other than that --> Deploy or Restart, using history revisions :: [sha_commit_id]
  const commitid =(deploy_unixtime < restart_unixtime)? `${sha_commit_id}_${restart_unixtime}` : sha_commit_id;

  /////////////////////////
  //Get configure by control tower

  //Set control tower credentials
  const run_domain = 'control-tower2.bwing.app';
  const run_version = '2.0.0';
  const run_token = require('./keel_auth.json').token;
  const domain = (process.env.NODE_ENV == 'prd')? `https://${run_domain}` : `http://localhost:8081`;
  const url = `${domain}/hmt/get/configuration`;
  const params = {
    appli_name : appli_name,
    version : run_version,
    token : run_token,
    server_code : server_code,
    environment : environment,
    hostname: process.env.HOSTNAME,
    commitid: commitid,
    component_version: process.env.VERSION || ((args.series=='v2')? '2.0.0' : '1.1.0'),
  }

  //Get configure
  const result = await getRequest(url, params, )
  .then(response => {
    if (response.data?.status_code != 0) {
      throw Error(`status_code:${response.data?.status_code}`)
    }
    return response.data
  })
  .catch(err => {
    console.error(err)
    process.exit(-1)
  })

  /////////////////////////
  //Exports configure

  //Commit id
  module.exports.commit_id = params.commitid;
  
  //formation
  const formation = result.formation
  module.exports.formation = formation;

  //Project id
  const google_prj_id = result.google_prj_id
  module.exports.google_prj_id = google_prj_id
  
  //env
  const env = result.env;
  module.exports.env = env;

  //version
  const version = params.component_version;
  module.exports.version = version;

  //common(status_code, status_msg, dummy)
  const common = result.common
  const status_code = common.status_code;
  const status = common.status_msg;
  const dummy = common.dummy;
  module.exports.status_code = common.status_code;
  module.exports.status = common.status_msg;
  module.exports.dummy = common.dummy;

  //env_client
  const env_client = result.env_client;
  module.exports.env_client = env_client;

  //Tokens for client
  const tokens_client = result.tokens_client
  module.exports.tokens_client = tokens_client

  //api connect
  const api_conn = result.api_conn;
  module.exports.api_conn = api_conn;

  //conversation api module name
  const conversationAPI = api_conn.conversationAPI.module
  module.exports.conversationAPI = conversationAPI;

  //Asker Google spreadsheet
  const asker_sheet_config = result.asker_sheet_config;
  module.exports.asker_sheet_config = asker_sheet_config;

  //Asker config
  const conf_keel = result.keel_auth;
  module.exports.conf_keel = conf_keel;

  //Newest config
  const conf_newest = result.keel_auth;
  module.exports.conf_newest = conf_newest;

  //Newest domain each elient
  let domains_newest = []
  for (let idx in formation) {
    domains_newest[formation[idx].client] = formation[idx]?.newest?.domain
  }
  module.exports.domains_newest = domains_newest

  //Newest multi_client each elient
  let sign_newest = []
  for (let idx in env_client) {
    sign_newest[idx] = env_client[idx]
  }
  module.exports.sign_newest = sign_newest

  /////////////////////////
  //Local config files exports

  //GooglespreadSheets api credentials path
  const google_sheets_credentials_path = `${dirpath}/config/${server_code}/google_sheets_api/credentials.json`;
  module.exports.google_sheets_credentials = google_sheets_credentials_path

  //GooglespreadSheets api token path
  const google_sheets_token_path = `${dirpath}/config/${server_code}/google_sheets_api/token.json`;
  module.exports.google_sheets_token = google_sheets_token_path

  //Linkage
  const getter = require(`${REQUIRE_PATH.modules}/linkage/asker/getter`)
  module.exports.getter = getter

  //Instance Answers
  async function initialAnswers(hostname) {
    try {
      //Hostname write to datastore
      if (hostname) await getter.initial(hostname)
      //Instance answers each clients
      for (let idx in asker_sheet_config) {
        await getter.instanceAnswers(idx)
      }
    } catch(err) {
      console.error(JSON.stringify(err))
    }
  }
  await initialAnswers(hostname)

  /////////////////////////
  //Return to app
  return {
    server_code,
    formation,
    env,
    status_code,
    status,
  }
}

module.exports = { configuration }