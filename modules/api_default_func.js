//config
const conf = require(REQUIRE_PATH.configure);
const env = conf.env


//moduler
const moduler = require(REQUIRE_PATH.moduler)

//System modules
const {getIP} = moduler.getIP

/**
 * @function
 */
const apiDefaultFunc = {

  //End next
  Final : (req, res) => {
    try {
      console.log()
    } catch(err) {
      console.error(err)
    }
  },

  /**
   * @function Setting logiD & Client code
   * @param {*} req 
   * @param {*} res 
   * @param {*} next 
   */
  firstSet: (req, res, next) => {
    try {

      //Set logiD
      req.logiD = (req.method == 'GET')? req.query.logiD : req.body.logiD;

      //API
      req.api = String(req.url.split('?')[0]).split('/').slice(1,).join('_').toUpperCase()

      //Get & set IP
      req.IP = getIP(req)

      //Mock
      req.mock = (req.method == 'GET')? req.query.mock : req.body.mock

      //body
      req.params = (req.method == 'GET')? req.query : (Object.keys(req.body).length)? req.body : req.query

      next()
    } catch(err) {
      console.error(err)
    }
  },

  /**
   * @function Logging request parameter
   * @param {*} req 
   * @param {*} res 
   * @param {*} next 
   */
  loggingParams : (req, res, next) => {
    try {

      //body or query parameter 
      const params = (req.method == 'GET')? req.query : (Object.keys(req.body).length)? req.body : req.query

      //Logging parameter
      console.log(`======${req.logiD} ASKER ${req.api}:`, JSON.stringify(params))

      //Logging header
      console.log(`======${req.logiD} ASKER HEADERS:`, JSON.stringify(req.headers))

      //IP
      console.log(`======${req.logiD} ASKER REQUEST IP:`, req.IP)

      next()
    } catch(err) {
      console.error(err)
    }
  },

};
module.exports = {
  apiDefaultFunc
};