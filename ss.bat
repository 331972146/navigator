start "winMongo" npm run-script winMongo
start "winRedis" npm run-script winRedis
set Debug=navigator & start "navigator" nodemon --ignore node_modules/ --ignore */public*/ .\\initSolo.js

::start "nginx" nginx -c .\\utilities\\nginx\\nginx.conf
nginx -s reload -c .\\utilities\\nginx\\nginx.conf