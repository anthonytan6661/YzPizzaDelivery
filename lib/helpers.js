/*
 * Helpers for various tasks
 *
 */

// Dependencies
var config = require('./config');
var crypto = require('crypto');
var https = require('https');
var querystring = require('querystring');
var StringDecoder = require('string_decoder');

// Container for all the helpers
var helpers = {};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function(str){
  try{
    var obj = JSON.parse(str);
    return obj;
  } catch(e){
    return {};
  }
};

// Create a SHA256 hash
helpers.hash = function(str){
  if(typeof(str) == 'string' && str.length > 0){
    var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
};

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = function(strLength){
  strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
  if(strLength){
    // Define all the possible characters that could go into a string
    var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

    // Start the final string
    var str = '';
    for(i = 1; i <= strLength; i++) {
        // Get a random charactert from the possibleCharacters string
        var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
        // Append this character to the string
        str+=randomCharacter;
    }
    // Return the final string
    return str;
  } else {
    return false;
  }
};

// Create a string of random numeric characters, of a given length for order Id uses
helpers.createRandomNumericId = function(strLength){
  strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
  if(strLength){
    // Define all the possible characters that could go into a string
    var possibleCharacters = '0123456789';

    // Start the final string
    var str = '';
    for(i = 1; i <= strLength; i++) {
        // Get a random charactert from the possibleCharacters string
        var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
        // Append this character to the string
        str+=randomCharacter;
    }
    // Return the final string
    return str;
  } else {
    return false;
  }
};

// accept payment through stripe.com api
// required data: amount, currency, customer, description
// optional data: none
helpers.payment = function(orderData,callback){
  // config the payload
  var payload = {
    amount  : orderData.amount,
    currency : config.currency,
    source : orderData.source,
    description : orderData.description
  };

  var stringCharge = querystring.stringify(payload);

  // configure the request details
  var requestDetails = {
    'protocol' : 'https:',
    'hostname' : 'api.stripe.com',
    'method' : 'POST',
    'path' : '/v1/charges',
    'auth' : config.stripe,
    'headers' : {
      'Content-Type' : 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(stringCharge)
    }
  };

  var req = https.request(requestDetails,function(res){
    // Grab the status of the sent request
    var status =  res.statusCode;

    // process the response
    var decoder = new StringDecoder.StringDecoder("utf-8");
    var buffer ="";
    var paymentData ={};

    res.on('data', function(data){
      buffer += data;
    });

    res.on('end',function(){
      buffer += decoder.end();
      paymentData = helpers.parseJsonToObject(buffer);

      // Callback successfully if the request went through
      if(status == 200 || status == 201){
        callback(false, paymentData);
      //  console.log(paymentData);
      } else {
        callback('Status code returned was '+status);
      }

    });

  });

  // Bind to the error event so it doesn't get thrown
  req.on('error',function(e){
    callback(e);
  });

  // Add the payload
  req.write(stringCharge);

  // End the request
  req.end();

};

// auto email through Mailgun API
helpers.sendEmail = function(orderData,paymentData, callback){
   // prepare the email Content
   var message  = '----YZ Pizza Order---- \n';
       message += 'Order ID :' + orderData.orderId +'\n';
       message += 'Order Date:' + orderData.orderDate +'\n';
       message += 'Total Amount:'+ orderData.total +'\n';
       message += 'Currency:'+ paymentData.currency +'\n';
       message += '----Thank you, Pls order again---';

   var payload ={
        from: config.mailGun.from,
        to: orderData.email,
        subject : orderData.description,
        text: message
   };

   var stringpayload = querystring.stringify(payload);
   // configure the request details
   var requestDetails = {
     'protocol': 'https:',
             'hostname': 'api.mailgun.net',
             'method': 'POST',
             'path': '/v3/'+ config.mailGun.domain + '/messages',
             'auth': `api:${config.mailGun.apiKey}`,
             'headers': {
                 'Content-Type': 'application/x-www-form-urlencoded',
                 'Content-Length': Buffer.byteLength(stringpayload)
             }
   };

   var req = https.request(requestDetails,function(res){
     // Grab the status of the sent request
     var status =  res.statusCode;

    if(status == 200 || status == 201){
        callback(false);
    } else {
        callback('Status code returned was '+status);
        console.log(status);
    }
   });

   // Bind to the error event so it doesn't get thrown
   req.on('error',function(e){
     callback(e);
   });
   // Add the payload
   req.write(stringpayload);
   // End the request
   req.end();
};



// Export the module
module.exports = helpers;
