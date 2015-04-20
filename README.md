# Project2
## how to start:
1. run server.js to start api manager
2. run mw_list_server.js to start middleware config server
3. run redis server
4. run business_service.js to start business server 

## test case:
1. signup: POST localhost:3001/signup (with email, password and isAdmin property)
2. signin: POST localhost:3001/signin (with email, password)
3. get all users: GET localhost:3001/public/users (with x-access-token and nonce in the header)
4. get single user: GET localhost:3001/public/user/:id (with x-access-token and nonce in the header)
5. modify single user: PUT localhost:3001/public/user/:id (with x-access-token, nonce and etag in the header, and data your want to change to)
6. delete signle user: DELETE localhost:3001/public/user/:id (with x-access-token, nonce and etag in the header)
7. get middleware list: GET localhost:7777/mwlist/:biz_name (biz_name is the name of the business service that want to query)
8. modify middleware priority: PUT localhost:7777/mwlist/:biz_name/:mw_name/:new_priority
