# YzPizzaDelivery
homework assignment #2 for node js master class

Web API Help Guide
----------------------------
[users]
path: api/users
methods support: POST, GET, PUT, DELETE

POST api/users
Body & data type
{ "fullName": string
  "email": string *valid as email address
  "address: string
  "password": string
  "tosAgreement": boolean }

GET api/users?=emailaddress
Headers: {"token" : tokenid }

PUT api/users
Body & data type
{ "fullName": string 
  "email": string
  "address": string 
  "password": string }

DELETE api/users?=emailaddress
Headers: {"token" : tokenid }

----------------------------
[token]
path: api/tokens
methods support: POST, GET, PUT, DELETE

POST api/tokens
Body & data type
{ "email": string,
  "password":string }

GET api/tokens?tokenid

PUT api/tokens
Body & data type
{ "id": string ,
  "extend": boolean }

DELETE api/tokens?tokenid

----------------------------
[items]
path: api/menu
methods support: GET

GET api/menu?=emailaddress
Headers: { "token" : tokenid}

----------------------------
[shoppingcarts]
path: api/shoppingcarts
methods support: POST, GET, PUT, DELETE

POST api/shoppingcarts
Body & data type 
{ "cartdetails":[{"itemId": string , "qty": integer }]}
Headers: { "token" : tokenid}

GET api/shoppingcarts?shoppingcardsid
Headers: { "token" : tokenid}

PUT api/shoppingcarts?shoppingcartsid
Body & data type
{ "id": string, 
   "cartdetails":[{"itemId": string , "qty": integer }]}
Headers: { "token" : tokenid}

DELETE api/shoppingcarts?shoppincartsid
Headers: { "token" : tokenid}

----------------------------
[orders]
path: api/orders
methods support: POST

POST api/orders?shoppingcartsid
Body & data type
{ "source": string *in real product, this should be card details collect from user that been tokenized with stripe client-side libraries } 
Headers: { "token" : tokenid}


----------------------------
