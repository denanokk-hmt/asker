//config
const conf = require(REQUIRE_PATH.configure);

//express
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', 
    { 
      title: `Asker on ${conf.env.environment}`,
      body: `Bwing project`  
    }
  );
});

module.exports = router;
