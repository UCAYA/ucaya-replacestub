var express = require('express');
var app = express();
var template = require('template-string');
var fetch = require("node-fetch");

app.get("/:uri", function (request, response) {
  
  var uri = request.params.uri
  if(uri)
    fetch(uri)
      .then(r => {
          var cloneHeader = function(k) {
            var v = r.headers.get(k)
            v && response.setHeader(k,v)
          }
          
          //todo handle etag ?
          //cloneHeader("etag")
          cloneHeader("content-type")
          response.setHeader('cache-control', 'max-age=60')

          return r.text().then(function (t) {

            var content = template(t, request.query)
            response.send(new Buffer(content))
          })
        })
        .catch(error => {
          //console.log("error", error)
          response.sendStatus(404);
        });
  else
    response.sendStatus(404);
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
