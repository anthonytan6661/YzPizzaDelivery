# YzPizzaDelivery
homework assignment #2 for node js master class

Web API Help Guide
----------------------------
[users]
path: api/users
methods support: POST, GET, PUT, DELETE

POST api/users
Body & data type
{
  "fullName": string
  "email": string *valid as email address
  "address: string
  "password": string
  "tosAgreement": boolean
}

GET api/users?=emailaddress
Headers: {
	"token" : accesstoken
}

PUT api/users
Body & data type
{
 "fullName": string 
 "email": string
 "address": string 
 "password": string
}

DELETE api/users?=emailaddress
Headers: {
	"token" : accesstoken
}

----------------------------
[token]
path: api/tokens
methods support: POST, GET, PUT, DELETE

POST api/tokens
Body & data type
{
 "email": string,
  "password":string
}

GET api/tokens?tokenid

PUT api/tokens
Body & data type
{
  "id": string ,
  "extend": boolean
}

DELETE api/tokens?tokenid

----------------------------
[items]
path: api/menu
methods support: GET

GET api/menu?=emailaddress
Headers: {
	"token" : accesstoken
}

----------------------------
[shoppingcarts]
path: api/shoppingcarts
----------------------------
[orders]
path: api/orders
----------------------------
