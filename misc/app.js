//Lets require/import the HTTP module
var http = require('http');
var express = require('express');
var app = express();
var request = require('request');
var url = require('url');
var config = require('./config.js');
var JSONIFY = require('json-stringify');
const HOST = 'localhost';
const PORT=8075;

var GitHubConfig = {
  'client_id'   : config['client_id'],
  'secret'      : config['secret'],
  'redirect_uri': '',
  'scope'       : '',
  'state'       : Math.round(Math.random()*10)
}


//Redirect to login url on GitHub
app.get("/login", function(req, res) {
  var url = 'https://github.com/login/oauth/authorize'
  + '?client_id=' + GitHubConfig.client_id
  + (GitHubConfig.scope ? '&scope=' + GitHubConfig.scope : '')
  + '&state=' + GitHubConfig.state;

  res.setHeader('location', url);
  res.statusCode = 302;
  res.end();
});

//Get 'em callbacks!
app.get("/callback", function(req, res) {
  var query = url.parse(req.url, true).query;
  if (query.state == GitHubConfig.state){
    payload = {
      'code':       	query.code,
      'client_id':     	GitHubConfig.client_id,
      'client_secret': 	GitHubConfig.secret
    }
    console.log(payload);
    request.post({
      url: 'https://github.com/login/oauth/access_token',
      formData: payload,
      headers: {'Accept': 'application/json'}
      }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
              var token = JSON.parse(body).access_token;
              res.statusCode = 302;
              console.log("Access Token: " + token);
              authorized(res, token);
            }
      }
    );

  };
});

var authorized = function(res, token){
  request.get({
    url: "https://api.github.com/user",
    headers: {'Authorization': 'token '+token, 'User-Agent': 'Mozilla/5.0'}},
    function(error, response, body) {
        if (!error && response.statusCode == 200) {
            body = JSON.parse(body);
            var user = body.login;
            res.end(JSONIFY({user}));
        } else {
            console.log(body);
            res.end(body);
        }
    }
  );
};

var syntaxHighlight = function(json) {
    if (typeof json != 'string') {
         json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

var server = app.listen(8075, function () {
   console.log("Example app listening at http on tcp/8075")
})
