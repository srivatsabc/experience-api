var GitHubConfig = {
  'client_id'   : "1006365990964-t5uvfuhc0onc8md7esqc4geghj58q96m.apps.googleusercontent.com",
  'secret'      : "PRp4UJ9XH7UDNsvzLYkUYpAm",
  'redirect_uri': '',
  'scope'       : 'openid email profile'
}

var token = true;

callAuth(function(req, res) {
    console.log("Calling googleauth")
    var url = 'https://accounts.google.com/o/oauth2/auth'
    + '?client_id=' + GitHubConfig.client_id
    + (GitHubConfig.scope ? '&scope=' + GitHubConfig.scope : '');

    res.setHeader('location', url);
    res.statusCode = 302;
    res.end();
    callToken(req,res);
});

callToken(function(req, res) {
  console.log("Calling googletoken")
  var query = url.parse(req.url, true).query;
  if (query.state == GitHubConfig.state){
    payload = {
      'code':       	  query.code,
      'client_id':     	GitHubConfig.client_id,
      'client_secret': 	GitHubConfig.secret
    }
    console.log(payload);
    request.post({
      url: 'https://www.googleapis.com/oauth2/v4/token',
      formData: payload,
      headers: {'Accept': 'application/json'}
      }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
              var token = JSON.parse(body).access_token;
              res.statusCode = 302;
              console.log("Access Token: " + token);
            }
      }
    );

  }
});

callAuth();
