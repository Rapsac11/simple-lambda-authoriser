'use strict';

var _AuthUtils = require('react-authenticate/lib/AuthUtils');

var express = require('express');

var axios = require('axios');

//var app = express();


exports.handle = function (event, context, callback) {

    //let something = e['queryStringParameters']['param']
    var token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ik9UTXhNVEZGUVVORE56TXpRakZFTkVKRk9UbENNakUwUlVVNU1rTkVSRVJET1RFeE16TkNNQSJ9.eyJodHRwOi8vYXV0aHouYXJ1cC5kaWdpdGFsL2F1dGhvcml6YXRpb24iOnsiZ3JvdXBzIjpbIkJIV1AiLCJQT1JUQUwiXSwicm9sZXMiOltdLCJwZXJtaXNzaW9ucyI6W119LCJodHRwOi8vdXNlcm1ldGEuYXJ1cC5kaWdpdGFsL3VzZXJfbWV0YWRhdGEiOnt9LCJpc3MiOiJodHRwczovL2FydXBkaWdpdGFsLmF1LmF1dGgwLmNvbS8iLCJzdWIiOiJ3YWFkfGlYblQ5ZFhUeVVpTl9pem5zSlFBM3J0eW1UZGJ4Xy1ySnVIM2J4VEdreUEiLCJhdWQiOiJBMWliNnZwR3ZQNjNIOFpveVZSNjJaRkUxTlF6SjhWNyIsImlhdCI6MTUzNjYzNjM3NiwiZXhwIjoxNTM2NjcyMzc2LCJhdF9oYXNoIjoibDhYTEFuR0dsWWVTMkFfNzZTZmFVZyIsIm5vbmNlIjoiSFkuR2lHVHVGSjUwNU8uZUs1eUhkaDFuM0sten5ac2wifQ.X3jtXHBwlfJWo88Ngs8J4DtsmX5h02OTBSzFpCkApbEL8aWP20IHkyBXdVWouDptsSAU5wrmEv9WDCgHpnQzG46WIEq-pMgJ3TaySe2mexv9isnq4Xwf_qwZxgJswV3vMrHbYDApNa00uFfHj4idTYxPbUDEbQ5-DpM8mw2WNo1UNm_GmSGWu23E8nr37s5jErCs4v20K_FMOjqz_zPeGulO6MGsgydsMbPBGCTHbLs4t6hLGP8xIBjb3dhrz2GJGMnVob-JT8hTa7BTmNkEhY1PLQTdXe4uck7cYEhFg2CNYRyYKttt5zIEn1TrnhjRwXwf5TtobBveAZ_2mJFO8g';

    var liveToken = event.authorizationToken;
    var accessToken = "5pgStrPdYnBVQGOzVsLQzcx4NTGPpv6_";
    var authDomain = "arupdigital.au.auth0.com";
    var endpoint = "/userinfo";

    (0, _AuthUtils.authflow)(liveToken).then(function (authz) {
        console.log(authz);
        axios({
            method: 'get',
            url: 'https://' + authDomain + endpoint,
            headers: {
                'Authorization': 'Bearer ' + accessToken
            }
        }).then(function (response) {
            callback(null, generatePolicy('user', 'Allow', event.methodArn, response));
        });
    }).catch(function (error) {
        console.log(error);
        callback(null, generatePolicy('user', 'Deny', event.methodArn));
    });
}; //end of lambda

var generatePolicy = function generatePolicy(principalId, effect, resource) {
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

    // Optional output with custom properties of the String, Number or Boolean type.
    authResponse.context = {
        "userinfo": resource
    };
    return authResponse;
};

//app.get('/', (req, res) => res.send('Hello World!'))
//app.listen(3002);
//console.log('listening on 3002');
