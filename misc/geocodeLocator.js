var request = require('request');
let header = require('./utils/header');
var config = require('./config');
var http = require('http');
var json = require('json-parser');
const uuidv4 = require('uuid/v4');
var dateFormat = require('dateformat');
var cache = require('memory-cache');
var JSONIFY = require('json-stringify');

function getEndpoint(reqValue, req, res) {
  var __CACHE_KEY__ = config['CACHE_KEY'];
  let key = __CACHE_KEY__ + req.originalUrl || req.url;
  var __HTTP_SUCCESS__ = Number(config['HTTP_SUCCESS']);

  let cachedBody = cache.get(key)
  if (cachedBody){
    console.log("Responding from cache ..")
    res = header.setHeaders(res, __HTTP_SUCCESS__);
    res.end(cachedBody);
  }else{
    var statusCode = 0;
    console.log("Going to backend ..");
    var __CACHE_TIMEOUT__ = Number(config['CACHE_TIMEOUT']);
    var __HTTP_SERVICE_NOT_FOUND__ = Number(config['HTTP_SERVICE_NOT_FOUND']);
    var __HTTP_NOT_FOUND__ = Number(config['HTTP_NOT_FOUND']);
    var __USERNAME__ = config['user'];
    var __PASSWORD__ = config['password'];
    var error = "NO_ERROR";
    console.log("url : " + config[process.env.RUNTIME_ENV_TYPE + '_endpoint'].replace(config['replaceString'], reqValue));

    var start = new Date();
    request.get({
      url: config[process.env.RUNTIME_ENV_TYPE + '_endpoint'].replace(config['replaceString'], reqValue),
      headers: {
        'Authorization': 'Basic ' + new Buffer.from(__USERNAME__ + ':' + __PASSWORD__).toString('base64')
      },
      gzip: true
    }, function(error, response, body) {
          if (!error && response.statusCode == __HTTP_SUCCESS__) {
            var jsonResult = json.parse(body);
            if(jsonResult.results[0].toString().length == 0){
              body = config(config['notfound_status_code'] + '_msg').replace(config['replaceString'], reqValue);
              res = header.setHeaders(resapi, res.statusCode);
              res.end(body);
            }else{
              var results = {
                iata_code: jsonResult.results[0].iata_code,
                airport_name: jsonResult.results[0].name,
                latitude_deg: jsonResult.results[0].latitude_deg,
                longitude_deg: jsonResult.results[0].longitude_deg
              }
              body = JSONIFY({results});
              res = header.setHeaders(res, response.statusCode);
              res.end(body);
              cache.put(key, body, __CACHE_TIMEOUT__);
            }
          }else {
             if(error != null && error.toString().includes(config['HTTP_CONNECTION_REFUSED_Error_Message'])){
                statusCode = config['HTTP_CONNECTION_REFUSED_Status_Code'];
                body = config['eror_msg_template'].replace('ENDPOINT', config[process.env.RUNTIME_ENV_TYPE + '_endpoint'].replace('IATA_CODE', reqValue)).replace('CODE', statusCode).replace('MESSAGE', config[statusCode + '_msg']).replace('STATUS', config[statusCode + '_msg_status']);
                res = header.setHeaders(res, statusCode);
                res.end(body);
              }else{
                console.log("Error Status: " + response.statusCode);
                res = header.setHeaders(res, response.statusCode);
                body = config['eror_msg_template'].replace('ENDPOINT', config[process.env.RUNTIME_ENV_TYPE + '_endpoint'].replace('IATA_CODE', reqValue)).replace('CODE', response.statusCode).replace('MESSAGE', config[response.statusCode + '_msg']).replace('STATUS', config[response.statusCode + '_msg_status']);
                res.end(body);
            }
          }
      }
    );
  }
}

module.exports.getEndpoint = getEndpoint;
