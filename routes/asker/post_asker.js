'use strict';

//config
const conf = require(REQUIRE_PATH.configure);
const code = conf.status_code

//express
const express_res = conf.express_res

//System modules
const updater = require(`${REQUIRE_PATH.modules}/linkage/asker/updater`)


/**
 * Update Asker answers
 * @param {*} req 
 * @param {*} res 
 */
const updateAnswers = async (req, res, logiD) => {

  console.log(`=========${logiD} UPDATE ANSWERS===========`)

  //Update answers
  const result = await updater.updateAnswers(req, logiD)
  .then(async result => {
    return {
      type : "API",
      status_code : code.SUCCESS_ZERO,
      status_msg : `Success Update Asker answers. ${logiD}`,
      client : `${req.body.client}`,
      udt : result,
    }
  })
  .catch(err => {
    throw new Error(err)
  });

  //Response
  express_res.func(res, result)

  return 'success';
};
module.exports.updateAnswers = updateAnswers;

/**
 * Update Answer Response
 * @param {*} req 
 * @param {*} res 
 */
const updateResponse = async (req, res, logiD) => {

  console.log(`=========${logiD} UPDATE RESPONSE===========`)

  //Update response
  const result = await updater.updateResponse(req, logiD)
    .then(result => {
      return {
        type : "API",
        insert_row: result,
        batch_id: req.body.batch_id,
        status_code : code.SUCCESS_ZERO,
        status_msg : `Success Update Asker response. ${logiD}`,
        client : `${req.body.client}`,
        udt : new Date(),
      }
  })
  .catch(err => {
    throw new Error(err)
  });

  //Response
  express_res.func(res, result)

  return 'success';
};
module.exports.updateResponse = updateResponse;