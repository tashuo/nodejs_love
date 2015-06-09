var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Message = require('../models/message.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  Message.find(function(err, data){
  	console.log(data);
  	res.send(data);
  })
});


module.exports = router;
