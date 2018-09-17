# simple-lambda-authoriser
A simple Lambda function to control access to an API Gateway resource

Implementation of https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html

Usage
=============
```
git clone https://github.com/Rapsac11/simple-lambda-authoriser.git
cp simple-lambda-authoriser //my project folder
cd simple-lambda-authoriser && npm install
```

Configure
=============
Inside the `variables.js` file configure project variables.

Inside the build.sh file configure the name / location of your lambda function, s3 bucket and aws region.

Test environment
=============
`npm run dev` to start a local node server with the lambda authoriser function. This is useful for testing token credentials.

If the `userinfo` entry has been added to the `endpoints` array this will show the user info that gets passed from the authoriser function into the target lambda.

Building
=============
`npm run build` to deploy the function to AWS.

AWS setup
=============
In API Gateway; select your API and go Authorizers > Create New Authoriser.

Choose `request` for the Lambda Event Payload and add 2 headers: `authtoken` and `accesstoken`.

Optional - Turn off caching: read notes below.

Once created, you can test the function here. Click test and add a valid token and accesstoken in the header slots.

To apply; select the Authorization lambda in your API's method request.

Notes
=============
This function is currently returning an access policy for a specific resource. If you apply this authorisation lambda to multiple endpoints you may want to turn off caching as the cached policy will not work for a different endpoint - this will result in failed authentication for other auth'ed endpoints for the cache duration.

You can track logs for requests to an endpoint that use this authoriser in CloudWatch.

Metadata exported from the authoriser such as `userinfo` can be obtained in the target lambda in `event.requestContext.authorizer`
