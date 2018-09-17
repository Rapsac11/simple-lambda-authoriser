bucket=my.bucket.to.store.function.code
lambda=some-premade-nodejs-lambda-function
key_inside_bucket=assets
region=ap-southeast-2

babel lambda-function.js --out-file index.js
zip authoriser-request.zip index.js
zip -ur authoriser-request.zip variables.js
zip -ur authoriser-request.zip node_modules
aws s3 cp authoriser-request.zip s3://$bucket/$key_inside_bucket/ --region $region
aws lambda update-function-code --function-name $lambda --s3-bucket $bucket --s3-key $key_inside_bucket/authoriser-request.zip  --region $region
rm -rf authoriser-request.zip
rm -rf index.js
