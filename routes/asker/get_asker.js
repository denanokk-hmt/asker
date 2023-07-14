'use strict';

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code

//express
const express_res = conf.express_res

//System modules
const getter = require(`${REQUIRE_PATH.modules}/linkage/asker/getter`)


/**
 * Update Asker answers
 * Instance AI
 * @param {*} req 
 * @param {*} res 
 */
const updateAnswers = async (req, res, logiD) => {

  console.log(`=========${logiD} UPDATE ASKER hostname:${process.env.HOSTNAME}===========`)

  //Web hook by Keel API
  if (req.query.hook) {
    let msg
    switch (true) {
      case String(req.query.hostupdate) == 'false' && String(req.query.hostname) == String(process.env.HOSTNAME) :
        break;
      case req.query.hostupdate == true:
        msg = `Given update flag already done.`
      case String(req.query.hostname) != String(process.env.HOSTNAME) :
        msg = `hostname is not compaire.`
      default :
        console.log(`====${logiD} UPDATE GARD!! ====`)
        //Response contents
        const resMessages = {
          type : "API",
          status_code : code.WAR_V_ASKER_UPDATE_104,
          status_msg : msg,
          client : `${req.query.client}`,
          hostname : process.env.HOSTNAME,
        }
        //Response
        res.set('Access-Control-Allow-Origin', '*');
        res.send(JSON.stringify(resMessages));
    }
  }

  //1st response only 
  if (res.finished) return

  //console.log(`====${logiD} THROGH GARD ====`)
  console.log(JSON.stringify(req.query))

  //Update answers
  console.log(`=========${logiD} UPDATE START hostname:${process.env.HOSTNAME}===========`)
  await getter.updateAnswers(req.query.client, logiD)
    .then(async result => {

      const credentials = await getAskerCredentials(req, res, logiD)
      console.log(`========UPDATE credentials ${req.query.client} =======`)
      console.log(JSON.stringify(credentials))

      const config = await getAskerConfig(req, res, logiD)
      console.log(`========UPDATE config ${req.query.client} =======`)
      console.log(JSON.stringify(config))

    //Response contents
    const resMessages = {
      type : "API",
      status_code : code.SUCCESS_ZERO,
      status_msg : `Success Update Asker. ${logiD}`,
      client : `${req.query.client}`,
      hostname : process.env.HOSTNAME,
      hostupdate : false,
      udt : new Date(),
    }
    //Response
    res.set('Access-Control-Allow-Origin', '*');
    res.send(JSON.stringify(resMessages));

    return 'success';
  })
  .catch(err => {
    express_res.funcErr(res, err.message, code.ERR_A_SYSTEM_990)
    return 'Answers update error.'
  });
};
module.exports.updateAnswers = updateAnswers;

/**
 * Delete Asker answers
 * @param {*} req 
 * @param {*} res 
 */
const deleteAnswers = async (req, res, logiD) => {

  console.log(`=========DELETE ASKER===========`)

  //Delete response
  await getter.deleteAnswers(req.query.client, logiD)
  .then(async result => {

      const credentials = await getAskerCredentials(req, res, logiD)
      console.log(`========DELETE credentials ${req.query.client} =======`)
      console.log(JSON.stringify(credentials))

      const config = await getAskerConfig(req, res, logiD)
      console.log(`========DELETE config ${req.query.client} =======`)
      console.log(JSON.stringify(config))

    //Response contents
    const resMessages = {
      type : "API",
      status_code : code.SUCCESS_ZERO,
      status_msg : `Success Delete Asker.`,
      client : `${req.query.client}`,
      udt : result,
    }
    //Response
    res.set('Access-Control-Allow-Origin', '*');
    res.send(JSON.stringify(resMessages));

    return 'success';
  })
  .catch(err => {
    express_res.funcErr(res, err.message, code.ERR_A_SYSTEM_990)
    return 'Answers delete error.'
  });
};
module.exports.deleteAnswers = deleteAnswers;

/**
 * Get answers
 * @param {*} req 
 * @param {*} res 
 */
const getAskerAnswers = async (req, res, logiD) => {
  return await getter.answers(req.query.client, logiD)
  .catch(err => {
    express_res.funcErr(res, err.message, code.ERR_A_SYSTEM_990)
    return 'Answers get error.'
  });
};
module.exports.answers = getAskerAnswers;

/**
 * Get credentials
 * @param {*} req 
 * @param {*} res 
 */
const getAskerCredentials = async (req, res, logiD) => {
  return await getter.credentials(req.query.client, logiD)
  .catch(err => {
    express_res.funcErr(res, err.message, code.ERR_A_SYSTEM_990)
    return 'Credentials get error.'
  });
};
module.exports.credentials = getAskerCredentials;

/**
 * Get config
 * @param {*} req 
 * @param {*} res 
 */
const getAskerConfig = async (req, res, logiD) => {
  return await getter.config(req.query.client, logiD)
  .catch(err => {
    express_res.funcErr(res, err.message, code.ERR_A_SYSTEM_990)
    return 'Credentials get error.'
  });
};
module.exports.config = getAskerConfig;

/**
 * Update Answer Response
 * @param {*} req 
 * @param {*} res 
 */
const updateResponse = async (req, res) => {

  console.log(`=========UPDATE RESPONSE===========`)

  //Update response
  await getter.updateResponse(req.query.client)
  .then(result => {
    //Response contents
    const resMessages = {
      type : "API",
      status_code : code.SUCCESS_ZERO,
      status_msg : `Success Update Asker Answers response.`,
      client : `${req.query.client}`,
      udt : new Date(),
    }
    //Response
    res.set('Access-Control-Allow-Origin', '*');
    res.send(JSON.stringify(resMessages));

    return 'success';
  })
  .catch(err => {
    express_res.funcErr(res, err.message, code.ERR_A_SYSTEM_990)
    return 'response update error.'
  });
};
module.exports.updateResponse = updateResponse;