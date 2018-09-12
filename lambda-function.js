var express = require('express');
import { authflow } from 'react-authenticate/lib/AuthUtils'
var options = require('./variables.js')
var axios = require('axios');

const authDomain = options.auth0Domain
const endpoints = options.endpoints

if(process.env.NODE_ENV == 'development') {

  var app = express();

  const liveToken = options.devToken
  const accessToken = options.devAuthToken

  let requests = []

  endpoints.map(endpoint => {
    requests.push(
      axios({
        method: 'get',
        url: 'https://'+ authDomain + '/' + endpoint,
        headers: {
          'Authorization': 'Bearer '+ accessToken
        }
      })
    )
  })

  authflow(liveToken)
     .then(authz => {
       axios.all([...requests])
        .then(axios.spread(function (...responses) {
          var output = generatePolicy('user', 'Allow', 'event.methodArn', responses, endpoints)
          console.log(output)
        }))
    }).catch(error =>{
      console.log(error)
      var output = generatePolicy('user', 'Deny', 'event.methodArn')
      console.log(output.context)
    })
  app.get('/', (req, res) => res.send('Hello World!')); app.listen(3002); console.log('listening on 3002'); //express
}


if(process.env.NODE_ENV == 'production') {

  exports.handle = function(event, context, callback) {

    const liveToken = event.authorizationToken
    const accessToken = options.devAuthToken

    let requests = []

    endpoints.map(endpoint => {
      requests.push(
        axios({
          method: 'get',
          url: 'https://'+ authDomain + '/' + endpoint,
          headers: {
            'Authorization': 'Bearer '+ accessToken
          }
        })
      )
    })

    authflow(liveToken)
     .then(authz => {
       axios.all([...requests])
        .then(axios.spread(function (...responses) {
          callback(null, generatePolicy('user', 'Allow', event.methodArn, responses, endpoints))
        }))
    }).catch(error =>{
      console.log(error)
      callback(null, generatePolicy('user', 'Deny', event.methodArn));
    })

  }

}

var generatePolicy = function(principalId, effect, resource, metadata, requests) {
    var authResponse = {};

    authResponse.principalId = principalId;
    if (effect && resource) {
        var policyDocument = {};
        policyDocument.Version = '2012-10-17';
        policyDocument.Statement = [];
        var statementOne = {};
        statementOne.Action = 'execute-api:Invoke';
        statementOne.Effect = effect;
        statementOne.Resource = resource;
        policyDocument.Statement[0] = statementOne;
        authResponse.policyDocument = policyDocument;
    }

    authResponse.context = {};

    if (metadata) {
      metadata.map((item, index) =>{
        if(requests[index] == 'userinfo') { // temporary, not clean - authResponse.context can only be string, bool, or number (no objects)
          authResponse.context[(requests[index] + '-' + 'name')] = item.data.name
          authResponse.context[(requests[index] + '-' + 'firstname')] = item.data.given_name
          authResponse.context[(requests[index] + '-' + 'lastname')] = item.data.family_name
          authResponse.context[(requests[index] + '-' + 'email')] = item.data.nickname
        }
      })
    }
    return authResponse;
}
