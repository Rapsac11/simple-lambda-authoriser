var express = require('express');
var options = require('./variables-request.js')
var axios = require('axios');
import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'

const authDomain = options.auth0Domain
const endpoints = options.endpoints

const AUTHO_ALG = options.auth0Algorithm
const CLAIM_NAMESPACE = options.claimNamespace
const JWKS_URI = options.jwksUri

var getSigningKey = function(kid) {
  return new Promise((resolve, reject) => {
    const jwk = jwksClient({
      cache: true,
      cacheMaxEntries: 5,
      jwksUri: JWKS_URI,
    })

    jwk.getSigningKey(kid, (err, results) => {
      if (err) {
        reject(err)
      } else {
        resolve(results)
      }
    })
  })
}

var authflow = function(token) {
  const decoded = jwt.decode(token, { complete: true })
  const payload = decoded.payload
  const kid = decoded.header.kid

  return getSigningKey(kid).then(key => {
    return new Promise((resolve, reject) => {
      const signingKey = key.publicKey || key.rsaPublicKey
      try {
        jwt.verify(token, signingKey, { algorithms: [AUTHO_ALG] })
        resolve(payload[CLAIM_NAMESPACE])
      } catch (err) {
        reject(err)
      }
    })
  })
}

if(process.env.NODE_ENV == 'development') {

  var app = express();

  const liveToken = options.devToken
  const accessToken = options.devAccessToken

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
      console.log(output)
    })
  app.get('/', (req, res) => res.send('Hello World!')); app.listen(3002); console.log('listening on 3002');
}


if(process.env.NODE_ENV == 'production') {

  exports.handle = function(event, context, callback) {

    var headers = event.headers;
    var requestContext = event.requestContext;

    if(!headers.authtoken) {
      callback(null, generatePolicy('user', 'Deny', event.methodArn));
    }

    var liveToken = headers.authtoken
    var accessToken = headers.accesstoken

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
       if (accessToken) {
         axios.all([...requests])
          .then(axios.spread(function (...responses) {
            callback(null, generatePolicy('user', 'Allow', event.methodArn, responses, endpoints))
          }))
       } else {
         callback(null, generatePolicy('user', 'Allow', event.methodArn))
       }
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
