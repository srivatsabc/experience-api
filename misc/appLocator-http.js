var request = require('request');
var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('airport-localtor.properties');
var https = require('https');
var request = require('request');
var https = require('https');
var json = require('json-parser');
const uuidv4 = require('uuid/v4');
var dateFormat = require('dateformat');
var cache = require('memory-cache');
var JSONIFY = require('json-stringify');
const zlib = require('zlib');

function endResponse(resapi, body){
  var now = new Date();
  resapi.removeHeader('X-Powered-By');
  resapi.removeHeader('Date');
  resapi.removeHeader('Connection');
  resapi.header("Content-Type", "application/json");
  resapi.header("Global-Message-ID", uuidv4());
  resapi.header("Global-Timestamp", dateFormat(now, "ddd, d mmm yyyy, HH:MM:ss Z"));
  resapi.header("cache-control", "cache");
  res.header("Content-Encoding", "gzip");
  resapi.end(body);
}

function endError(resapi, statusCode, body){
  var now = new Date();
  resapi.statusCode = statusCode;
  resapi.removeHeader('X-Powered-By');
  resapi.removeHeader('Date');
  resapi.removeHeader('Connection');
  resapi.header("Content-Type", "application/json");
  resapi.header("Global-Message-ID", uuidv4());
  resapi.header("Global-Timestamp", dateFormat(now, "ddd, d mmm yyyy, HH:MM:ss Z"));
  resapi.end(body);
}

function getEndpoint(reqType, reqValue, reqapi, resapi) {
  var __CACHE_KEY__ = properties.get('global_CACHE_KEY');
  var __CACHE_TIMEOUT__ = properties.get('global_CACHE_TIMEOUT');
  var __HTTP_SUCCESS__ = properties.get('global_HTTP_SUCCESS');
  var __HTTP_SERVICE_NOT_FOUND__ = properties.get('global_HTTP_SERVICE_NOT_FOUND');
  let key = __CACHE_KEY__ + reqapi.originalUrl || reqapi.url;
  let cachedBody = cache.get(key)

  if (cachedBody){
    console.log("Responding from cache ..")
    endResponse (resapi, cachedBody)
  }else{
    console.log("Going to backend ..")
    var host = properties.get(reqType + '_host');
    var username = properties.get(reqType + '_user');
    var password = properties.get(reqType + '_password');
    var path = properties.get(reqType + '_uri');
    path = path.replace(properties.get(reqType + '_replaceString'), reqValue);
    console.log("path : " + path);
    var options = {
     host: host,
     port: 443,
     path: encodeURI(path),
     headers: {
       'Authorization': 'Basic ' + new Buffer.from(username + ':' + password).toString('base64')
     }
    };
     var startTime = new Date();
     request = https.get(options, function(res){
     var body = "";
     res.on('data', function(data) {
     body += data;
     });
     res.on('end', function() {
       console.log("Status:" + res.statusCode);
       if(res.statusCode == __HTTP_SUCCESS__){
         var jsonResult = json.parse(body);
         body = JSONIFY(jsonResult.d);
         if(jsonResult.d.results.toString().length == 0){
           //body = properties.get(reqType + '_' + properties.get(reqType + '_notfound_status_code') + '_msg').replace(properties.get(reqType + '_replaceString'), reqValue);
           res.statusCode = 404;
           body = properties.get('eror_msg_template').replace('ENDPOINT', properties.get(reqType + '_host') + properties.get(reqType + '_uri').replace(properties.get(reqType + '_replaceString'), reqValue).replace('IATA_CODE', reqValue)).replace('CODE', res.statusCode).replace('MESSAGE', properties.get(res.statusCode + '_msg')).replace('STATUS', properties.get(res.statusCode + '_msg_status'));
           endError (resapi, properties.get(reqType + '_notfound_status_code'), body);
         }else{
           zlib.gzip(body, function (_, result){
             endResponse (resapi, result)
             cache.put(key, result, __CACHE_TIMEOUT__);
           });
         }
       }else if (res.statusCode == __HTTP_SERVICE_NOT_FOUND__) {
         body = properties.get('eror_msg_template').replace('ENDPOINT', properties.get(reqType + '_host') + properties.get(reqType + '_uri').replace(properties.get(reqType + '_replaceString'), reqValue).replace('IATA_CODE', reqValue)).replace('CODE', res.statusCode).replace('MESSAGE', properties.get(res.statusCode + '_msg')).replace('STATUS', properties.get(res.statusCode + '_msg_status'));
         endError (resapi, res.statusCode, body)
       }

     })
     res.on('error', function(e) {
       console.log("Got error: " + e.message);
       resapi.header("Content-Type", "application/json");
       resapi.end(JSON.stringify(e.message));
       cache.put(key, body, __CACHE_TIMEOUT__);
     });
    });
  }
}

module.exports.getEndpoint = getEndpoint;
