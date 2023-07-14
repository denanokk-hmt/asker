'use strict';

/**
 * Response
 * @param {*} res 
 * @param {*} content
 */
const res = (
  res,
  content,
  haederKey='Access-Control-Allow-Origin',
  headerValue='*',
  contextType='application/json'
) => {
  if (res.finished) return
  res.set(haederKey, headerValue)
  switch (contextType) {
    case 'application/json':
    default:
      res.json(content);
  }
}
module.exports.func = res


/**
 * Error Response
 * @param {*} res 
 * @param {*} status 
 * @param {*} status_code 
 */
const errRes = (
  res, 
  status_msg, 
  status_code,
  haederKey='Access-Control-Allow-Origin', 
  headerValue='*', 
  contextType='application/json'
) => {
  //Response array set
  const content = {
    type : "SYSTEM",
    status_code : status_code,
    status_msg : status_msg,
    approval : false
  }

  if (res.finished) return
  res.set(haederKey, headerValue)
  switch (contextType) {
    case 'application/json':
    default:
      res.json(content);
  }
  return true
}
module.exports.funcErr = errRes