//Lets require/import the HTTP module
var express = require('express');
var app = express();
var request = require('request');
var url = require('url');
var config = require('./config');
var geocodeLocator = require('./appLocator-request');
let header = require('./utils/header');
const zlib = require('zlib');
var propertiesreader = require('properties-reader');

app.get("/exapi/v1/geocodes/:iata_code", function(req, res) {
  var properties = propertiesreader(process.env.APP_PROPERTIES);
  geocodeLocator.getEndpoint('default_filter', req.params.iata_code.toUpperCase(), req, res);
});

var server = app.listen(8073, function () {
   console.log("Example app listening at http on tcp/8073")
})
