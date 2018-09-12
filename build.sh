bucket=mybucket
lambda=test-lambda-authoriser
key_inside_bucket=assets
region=ap-southeast-2

babel lambda-function.js --out-file index.js
zip authoriser.zip index.js
zip -ur authoriser.zip variables.js
zip -ur authoriser.zip node_modules
aws s3 cp authoriser.zip s3://$bucket/$key_inside_bucket/ --region $region
aws lambda update-function-code --function-name $lambda --s3-bucket $bucket --s3-key $key_inside_bucket/authoriser.zip  --region $region
rm -rf authoriser.zip
rm -rf index.js
