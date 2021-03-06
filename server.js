var express = require('express');
var app = express();
var template = require('template-string');
var fetch = require("node-fetch");
var atob = require('atob');
var parseDataUrl = require('parse-data-url');

var maxage = 86400

function handleUri(uri, request, response) {
  fetch(uri)
    .then(r => {
        var cloneHeader = function(k) {
          var v = r.headers.get(k)
          v && response.setHeader(k,v)
        }

        if(request.query.hash 
            && request.query.hash === request.header("if-match")){
          response.sendStatus(304)
          return
        }
        
        response.contentType(r.headers.get('content-type'))
        response.setHeader('Cache-Control', 'max-age=' + maxage)

        if(request.query.hash) {
          response.header('ETag', request.query.hash)
        }

        return r.text().then(function (t) {

          var content = template(t, request.query)
          response.send(new Buffer(content))
        })
      })
      .catch(error => {
        console.log("error", error)
        response.sendStatus(404);
      });
}

function handleDataUri(dataUri, request, response) {
  if(request.query.hash 
      && request.query.hash === request.header("if-match")){
    response.sendStatus(304)
    return
  }

  if(request.query.hash) {
    response.header('ETag', request.query.hash)
  }

  var parsedDataUrl =  parseDataUrl(dataUri)
  if(!parsedDataUrl) {
    console.log("wrong datauri", dataUri)
    response.sendStatus(404);
    return
  }

  response.setHeader('Cache-Control', 'max-age=' + maxage)
  

  response.contentType(parsedDataUrl.mediaType)
  var data = parsedDataUrl.base64 ? atob(parsedDataUrl.data) : parsedDataUrl.data
  var content = template(data, request.query)
  response.send(new Buffer(content))
}


app.get("/replace", function (request, response) {
  
  console.log(request.query);
  console.log(request.headers);

  var uri = request.query.uri
  if(request.query.uri)
    handleUri(request.query.uri, request, response)
  else if(request.query.dataUri)
    handleDataUri(request.query.dataUri, request, response)    
  else {
    console.log("no endpoint")
    response.sendStatus(404);
  }
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
