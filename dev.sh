test=foo
echo $test
babel lambda-function.js --out-file local-index.js
echo $NODE_ENV
node local-index.js
rm -rf local-index.js
