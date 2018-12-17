/*
 * Request Handlers
 *
 */

// Dependencies
var _data = require('./data');
var helpers = require('./helpers');
var config = require('./config');

// Define all the handlers
var handlers = {};

// Ping
handlers.ping = function(data,callback){
  setTimeout(function(){
    callback(200);
  },5000);

};

// Not-Found
handlers.notFound = function(data,callback){
  callback(404);
};

// Menu items
handlers.items = function(data,callback){
  var acceptableMethods = ['get'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._items[data.method](data,callback);
  } else {
    callback(405);
  }
};

// Container for all the menu items methods
handlers._items  = {};

// Required data: email
// Optional data: none
handlers._items.get = function(data,callback){
  // Check that email is valid
  var email = typeof(data.queryStringObject.email) ==='string' && /^[\w+\d+._]+\@[\w+\d+_+]+\.[\w+\d+._]{2,8}$/.test(data.queryStringObject.email) ? data.queryStringObject.email.trim() :false ;

  if(email){
    // Get token from headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token is valid for the email
    handlers._tokens.verifyToken(token,email,function(tokenIsValid){
      if(tokenIsValid){
        // Lookup the menu items
        _data.read('menu','items',function(err,data){
          if(!err && data){
            callback(200,data);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403,{"Error" : "Missing required token in header, or token is invalid."})
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field'})
  }
};

// Users
handlers.users = function(data,callback){
  var acceptableMethods = ['post','get','put','delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._users[data.method](data,callback);
  } else {
    callback(405);
  }
};

// Container for all the users methods
handlers._users  = {};

// Users - post
// Required data: fullName, email, address, password, tosAgreement
// Optional data: none
handlers._users.post = function(data,callback){
  // Check that all required fields are filled out
  var fullName = typeof(data.payload.fullName) == 'string' && data.payload.fullName.trim().length > 0 ? data.payload.fullName.trim() : false;
  var email = typeof(data.payload.email) ==='string' && /^[\w+\d+._]+\@[\w+\d+_+]+\.[\w+\d+._]{2,8}$/.test(data.payload.email) ? data.payload.email.trim() :false ;
  var address = typeof(data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

  if(fullName && email && address && password && tosAgreement){
    // Make sure the user doesnt already exist
    _data.read('users',email,function(err,data){
      if(err){
        // Hash the password
        var hashedPassword = helpers.hash(password);

        // Create the user object
        if(hashedPassword){
          var userObject = {
            'fullName' : fullName,
            'email' : email,
            'address' : address,
            'hashedPassword' : hashedPassword,
            'tosAgreement' : true
          };

          // Store the user
          _data.create('users',email,userObject,function(err){
            if(!err){
              callback(200);
            } else {
              callback(500,{'Error' : 'Could not create the new user'});
            }
          });
        } else {
          callback(500,{'Error' : 'Could not hash the user\'s password.'});
        }

      } else {
        // User alread exists
        callback(400,{'Error' : 'A user with that email already exists'});
      }
    });

  } else {
    callback(400,{'Error' : 'Missing required fields Or Invalid email address'});
  }

};

// Required data: email
// Optional data: none
handlers._users.get = function(data,callback){
  // Check that email is valid
  var email = typeof(data.queryStringObject.email) ==='string' && /^[\w+\d+._]+\@[\w+\d+_+]+\.[\w+\d+._]{2,8}$/.test(data.queryStringObject.email) ? data.queryStringObject.email.trim() :false ;

  if(email){

    // Get token from headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token,email,function(tokenIsValid){
      if(tokenIsValid){
        // Lookup the user
        _data.read('users',email,function(err,data){
          if(!err && data){
            // Remove the hashed password from the user user object before returning it to the requester
            delete data.hashedPassword;
            callback(200,data);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403,{"Error" : "Missing required token in header, or token is invalid."})
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field'})
  }
};

// Required data: email
// Optional data: fullName, address, password (at least one must be specified)
handlers._users.put = function(data,callback){
  // Check for required field
  var email = typeof(data.payload.email) ==='string' && /^[\w+\d+._]+\@[\w+\d+_+]+\.[\w+\d+._]{2,8}$/.test(data.payload.email) ? data.payload.email.trim() :false ;
  // Check for optional fields
  var fullName = typeof(data.payload.fullName) == 'string' && data.payload.fullName.trim().length > 0 ? data.payload.fullName.trim() : false;
  var address = typeof(data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  // Error if phone is invalid
  if(email){
    // Error if nothing is sent to update
    if(fullName || address || password){

      // Get token from headers
      var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

      // Verify that the given token is valid for the phone number
      handlers._tokens.verifyToken(token,email,function(tokenIsValid){
        if(tokenIsValid){

          // Lookup the user
          _data.read('users',email,function(err,userData){
            if(!err && userData){
              // Update the fields if necessary
              if(fullName){
                userData.fullName = fullName;
              }
              if(address){
                userData.address = address;
              }
              if(password){
                userData.hashedPassword = helpers.hash(password);
              }
              // Store the new updates
              _data.update('users',email,userData,function(err){
                if(!err){
                  callback(200);
                } else {
                  callback(500,{'Error' : 'Could not update the user.'});
                }
              });
            } else {
              callback(400,{'Error' : 'Specified user does not exist.'});
            }
          });
        } else {
          callback(403,{"Error" : "Missing required token in header, or token is invalid."});
        }
      });
    } else {
      callback(400,{'Error' : 'Missing fields to update.'});
    }
  } else {
    callback(400,{'Error' : 'Missing required field.'});
  }

};

// Required data: email
// Cleanup old shopping carts  associated with the user
handlers._users.delete = function(data,callback){
  // Check that email is valid
  var email = typeof(data.queryStringObject.email) ==='string' && /^[\w+\d+._]+\@[\w+\d+_+]+\.[\w+\d+._]{2,8}$/.test(data.queryStringObject.email) ? data.queryStringObject.email.trim() :false ;
  if(email){

    // Get token from headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

    // Verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token,phone,function(tokenIsValid){
      if(tokenIsValid){
        // Lookup the user
        _data.read('users',email,function(err,userData){
          if(!err && userData){
            // Delete the user's data
            _data.delete('users',email,function(err){
              if(!err){
                // Delete each of the checks associated with the user
                var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                var checksToDelete = userChecks.length;
                if(checksToDelete > 0){
                  var checksDeleted = 0;
                  var deletionErrors = false;
                  // Loop through the checks
                  userChecks.forEach(function(checkId){
                    // Delete the check
                    _data.delete('checks',checkId,function(err){
                      if(err){
                        deletionErrors = true;
                      }
                      checksDeleted++;
                      if(checksDeleted == checksToDelete){
                        if(!deletionErrors){
                          callback(200);
                        } else {
                          callback(500,{'Error' : "Errors encountered while attempting to delete all of the user's checks. All checks may not have been deleted from the system successfully."})
                        }
                      }
                    });
                  });
                } else {
                  callback(200);
                }
              } else {
                callback(500,{'Error' : 'Could not delete the specified user'});
              }
            });
          } else {
            callback(400,{'Error' : 'Could not find the specified user.'});
          }
        });
      } else {
        callback(403,{"Error" : "Missing required token in header, or token is invalid."});
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field'})
  }
};

// Tokens
handlers.tokens = function(data,callback){
  var acceptableMethods = ['post','get','put','delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._tokens[data.method](data,callback);
  } else {
    callback(405);
  }
};

// Container for all the tokens methods
handlers._tokens  = {};

// Tokens - post
// Required data: email, password
// Optional data: none
handlers._tokens.post = function(data,callback){
  var email = typeof(data.payload.email) ==='string' && /^[\w+\d+._]+\@[\w+\d+_+]+\.[\w+\d+._]{2,8}$/.test(data.payload.email) ? data.payload.email.trim() :false ;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if(email && password){
    // Lookup the user who matches that phone number
    _data.read('users',email,function(err,userData){
      if(!err && userData){
        // Hash the sent password, and compare it to the password stored in the user object
        var hashedPassword = helpers.hash(password);
        if(hashedPassword == userData.hashedPassword){
          // If valid, create a new token with a random name. Set an expiration date 1 hour in the future.
          var tokenId = helpers.createRandomString(20);
          var expires = Date.now() + 1000 * 60 * 60;
          var tokenObject = {
            'email' : email,
            'id' : tokenId,
            'expires' : expires
          };

          // Store the token
          _data.create('tokens',tokenId,tokenObject,function(err){
            if(!err){
              callback(200,tokenObject);
            } else {
              callback(500,{'Error' : 'Could not create the new token'});
            }
          });
        } else {
          callback(400,{'Error' : 'Password did not match the specified user\'s stored password'});
        }
      } else {
        callback(400,{'Error' : 'Could not find the specified user.'});
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field(s).'})
  }
};

// Tokens - get
// Required data: id
// Optional data: none
handlers._tokens.get = function(data,callback){
  // Check that id is valid
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;

  if(id){
    // Lookup the token
    _data.read('tokens',id,function(err,tokenData){
      if(!err && tokenData){
        callback(200,tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field, or field invalid'})
  }
};

// Tokens - put
// Required data: id, extend
// Optional data: none
handlers._tokens.put = function(data,callback){
  var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
  if(id && extend){
    // Lookup the existing token
    _data.read('tokens',id,function(err,tokenData){
      if(!err && tokenData){
        // Check to make sure the token isn't already expired
        if(tokenData.expires > Date.now()){
          // Set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60;
          // Store the new updates
          _data.update('tokens',id,tokenData,function(err){
            if(!err){
              callback(200);
            } else {
              callback(500,{'Error' : 'Could not update the token\'s expiration.'});
            }
          });
        } else {
          callback(400,{"Error" : "The token has already expired, and cannot be extended."});
        }
      } else {
        callback(400,{'Error' : 'Specified user does not exist.'});
      }
    });
  } else {
    callback(400,{"Error": "Missing required field(s) or field(s) are invalid."});
  }
};


// Tokens - delete
// Required data: id
// Optional data: none
handlers._tokens.delete = function(data,callback){
  // Check that id is valid
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if(id){
    // Lookup the token
    _data.read('tokens',id,function(err,tokenData){
      if(!err && tokenData){
        // Delete the token
        _data.delete('tokens',id,function(err){
          if(!err){
            callback(200);
          } else {
            callback(500,{'Error' : 'Could not delete the specified token'});
          }
        });
      } else {
        callback(400,{'Error' : 'Could not find the specified token.'});
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field'})
  }
};

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function(id,email,callback){
  // Lookup the token
  _data.read('tokens',id,function(err,tokenData){
    if(!err && tokenData){
      // Check that the token is for the given user and has not expired
      if(tokenData.email == email && tokenData.expires > Date.now()){
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};


// Shopping carts
handlers.shoppingcarts = function(data,callback){
  var acceptableMethods = ['post','get','put','delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._shoppingcarts[data.method](data,callback);
  } else {
    callback(405);
  }
};

// Container for all the shopping carts methods
handlers._shoppingcarts  = {};

// Shopping cart - post
// Required data: orders details * item id, qty
// Optional data: none
handlers._shoppingcarts.post = function(data,callback){
  // Validate inputs
  var verifyResult = false;
  var cartdetails = data.payload.cartdetails;

  // validate the data inside the cart details
  if(cartdetails && cartdetails.length > 0 ){
   for(var i=0;  i< cartdetails.length; i++){
     var itemId = typeof(cartdetails[i].itemId)== 'string' && cartdetails[i].itemId.trim().length > 0 ? cartdetails[i].itemId.trim() : false;
     var qty = typeof(cartdetails[i].qty) =='number' && cartdetails[i].qty %1 === 0  && cartdetails[i].qty >= 1 ? cartdetails[i].qty : false;

     if(itemId && qty){
       verifyResult= true;
     } else {
       verifyResult= false;
       break;
     }
   }
  }

  if(verifyResult){

    // get menu item from system for later price verify and calculation
    var templist = [];
    _data.read('menu','items',function(err,itemlist){
        templist = itemlist;
    });

    // Get token from headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

    // Lookup the user email by reading the token
    _data.read('tokens',token,function(err,tokenData){
      if(!err && tokenData){
        var userEmail = tokenData.email;

        // Lookup the user data
        _data.read('users',userEmail,function(err,userData){
          if(!err && userData){

            var userShoppingCarts = typeof(userData.shoppingcarts) == 'object' && userData.shoppingcarts instanceof Array ? userData.shoppingcarts : [];

              // Create random id for shopping cart
              var cartId = helpers.createRandomNumericId(10);

              // Create check object including userPhone
              var cartObject = {
                'id' : cartId,
                'userEmail' : userEmail,
                'createdDate' : new Date(),
                'totalQty': 0,
                'totalAmount' : 0,
                'cartdetails':[]
              };
             // loop through the cart details and retrieve the unitprice & name, and calculate the total amount of the cart
              for(var i=0;  i< cartdetails.length; i++){

                 for(var j=0; j< templist.length; j++){
                   if(templist[j].id==cartdetails[i].itemId){
                     var cartDetail = {
                       'itemId': cartdetails[i].itemId,
                       'Name': templist[j].Name,
                       'qty': cartdetails[i].qty,
                       'unitPrice': templist[j].unitPrice
                     };
                     cartObject.totalAmount+=  (cartdetails[i].qty*templist[j].unitPrice);
                     cartObject.totalQty+= cartdetails[i].qty;
                     cartObject.cartdetails.push(cartDetail);
                     break;
                   }
                 }

              }

              // Save the object
              _data.create('shoppingcarts',cartId,cartObject,function(err){
                if(!err){
                  // Add check id to the user's object
                  userData.carts = userShoppingCarts;
                  userData.carts.push(cartId);

                  // Save the new user data
                  _data.update('users',userEmail,userData,function(err){
                    if(!err){
                      // Return the data about the new check
                      callback(200,cartObject);
                    } else {
                      callback(500,{'Error' : 'Could not update the user with the new check.'});
                    }
                  });
                } else {
                  callback(500,{'Error' : 'Could not create the new check'});
                }
              });
          } else {
            callback(403);
          }
        });
      } else {
        callback(403);
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required inputs, or inputs are invalid'});
  }
};



// Shopping cart - get
// Required data: id
// Optional data: none
handlers._shoppingcarts.get = function(data,callback){
  // Check that id is valid

  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 10 ? data.queryStringObject.id.trim() : false;
  console.log(data.queryStringObject.id);
  console.log(data.queryStringObject.id.trim().length);

  if(id){
    // Lookup the shopping cart
    _data.read('shoppingcarts',id,function(err,checkData){
      if(!err && checkData){
        // Get the token that sent the request
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        // Verify that the given token is valid and belongs to the user who created the check



        handlers._tokens.verifyToken(token,checkData.userEmail,function(tokenIsValid){
          if(tokenIsValid){
            callback(200,checkData);
          } else {

            callback(403);
          }
        });
      } else {
        callback(404);
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field, or field invalid'})
  }
};


// shoppingcarts - put
// Required data: id
// Optional data: carts (one must be sent)
handlers._shoppingcarts.put = function(data,callback){
  // Check for required field
  var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 10 ? data.payload.id.trim() : false;

  // Check for carts details
  var verifyResult = false;
  var cartdetails = data.payload.cartdetails;

  // validate the data inside the cart details
  if(cartdetails && cartdetails.length > 0 ){
   for(var i=0;  i< cartdetails.length; i++){
     var itemId = typeof(cartdetails[i].itemId)== 'string' && cartdetails[i].itemId.trim().length > 0 ? cartdetails[i].itemId.trim() : false;
     var qty = typeof(cartdetails[i].qty) =='number' && cartdetails[i].qty %1 === 0  && cartdetails[i].qty >= 1 ? cartdetails[i].qty : false;
     if(itemId && qty){
       verifyResult= true;
     } else {
       verifyResult= false;
       break;
     }
   }
  }
  // Error if id is invalid
  if(id && verifyResult){
    // get menu item from system for later price verify and calculation
    var templist = [];
    _data.read('menu','items',function(err,itemlist){
        templist = itemlist;
    });

      // Lookup the shoppingcarts
      _data.read('shoppingcarts',id,function(err,cartData){
        if(!err && cartData){
          // Get the token that sent the request
          var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
          // Verify that the given token is valid and belongs to the user who created the check
          handlers._tokens.verifyToken(token,cartData.userEmail,function(tokenIsValid){
            if(tokenIsValid){
              // Update check data where necessary

              // Create check object including userPhone
              var cartObject = {
                'id' : id,
                'userEmail' : cartData.userEmail,
                'createdDate' : new Date(),
                'totalQty': 0,
                'totalAmount' : 0,
                'cartdetails':[]
              };
             // loop through the cart details and retrieve the unitprice & name, and calculate the total amount of the cart
              for(var i=0;  i< cartdetails.length; i++){

                 for(var j=0; j< templist.length; j++){
                   if(templist[j].id==cartdetails[i].itemId){
                     var cartDetail = {
                       'itemId': cartdetails[i].itemId,
                       'Name': templist[j].Name,
                       'qty': cartdetails[i].qty,
                       'unitPrice': templist[j].unitPrice
                     };
                     cartObject.totalAmount+=  (cartdetails[i].qty*templist[j].unitPrice);
                     cartObject.totalQty+= cartdetails[i].qty;
                     cartObject.cartdetails.push(cartDetail);
                     break;
                   }
                 }

              }

              // Store the new updates
              _data.update('shoppingcarts',id,cartObject,function(err){
                if(!err){
                  callback(200);
                } else {
                  callback(500,{'Error' : 'Could not update the shopping cart .'});
                }
              });
            } else {
              console.log('error here');
              callback(403);
            }
          });
        } else {
          callback(400,{'Error' : 'shopping cart ID did not exist.'});
        }
      });

  } else {
    callback(400,{'Error' : 'Missing required field.'});
  }
};


// shopping cart - delete
// Required data: id
// Optional data: none
handlers._shoppingcarts.delete = function(data,callback){
  // Check that id is valid
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 10 ? data.queryStringObject.id.trim() : false;
  if(id){
    // Lookup the check
    _data.read('shoppingcarts',id,function(err,checkData){
      if(!err && checkData){
        // Get the token that sent the request
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        // Verify that the given token is valid and belongs to the user who created the check
        handlers._tokens.verifyToken(token,checkData.userEmail,function(tokenIsValid){
          if(tokenIsValid){

            // Delete the shopping carts
            _data.delete('shoppingcarts',id,function(err){
              if(!err){
                // Lookup the user's object to get all their checks
                _data.read('users',checkData.userEmail,function(err,userData){
                  if(!err){
                    var userCarts = typeof(userData.carts) == 'object' && userData.carts instanceof Array ? userData.carts : [];

                    // Remove the deleted check from their list of checks
                    var checkPosition = userCarts.indexOf(id);
                    if(checkPosition > -1){
                      userCarts.splice(checkPosition,1);
                      // Re-save the user's data
                      userData.carts = userCarts;
                      _data.update('users',checkData.userEmail,userData,function(err){
                        if(!err){
                          callback(200);
                        } else {
                          callback(500,{'Error' : 'Could not update the user.'});
                        }
                      });
                    } else {
                      callback(500,{"Error" : "Could not find the check on the user's object, so could not remove it."});
                    }
                  } else {
                    callback(500,{"Error" : "Could not find the user who created the check, so could not remove the check from the list of checks on their user object."});
                  }
                });
              } else {
                callback(500,{"Error" : "Could not delete the check data."})
              }
            });
          } else {
            callback(403);
          }
        });
      } else {
        callback(400,{"Error" : "The shopping cart ID specified could not be found"});
      }
    });
  } else {
    callback(400,{"Error" : "Missing valid id"});
  }
};

// Orders
handlers.orders = function(data,callback){
  var acceptableMethods = ['post','get','delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._orders[data.method](data,callback);
  } else {
    callback(405);
  }
};

// Container for all the orders methods
handlers._orders  = {};

// order  - post
// Required data: cart Id
// Optional data: none
handlers._orders.post = function(data,callback){
  //validate the id
  var shoppingcartid = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 10 ? data.queryStringObject.id.trim() : false;;
  if(shoppingcartid){
    // Get token from headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

    // Lookup the user email by reading the token
    _data.read('tokens',token,function(err,tokenData){
      if(!err && tokenData){
        var userEmail = tokenData.email;

        // Lookup the user data
        _data.read('users',userEmail,function(err,userData){
          if(!err && userData){
          var cartid = userData.carts[0];
            if (cartid == shoppingcartid){
               // Lookup the shoppint cart
               _data.read('shoppingcarts',cartid, function(err,cartData){
                  var totalQty = typeof(cartData.totalQty) =='number' && cartData.totalQty %1 === 0 && cartData.totalQty >= 0 ? cartData.totalQty : false;
                  var totalAmount = typeof(cartData.totalAmount) =='number' && cartData.totalAmount >= 0 ? cartData.totalAmount : false;
                  if (totalQty && totalAmount){
                    var payload = {
                                amount  : totalAmount,
                               currency : config.currency,
                                 source : 'tok_visa',   // testing token, in real product, this should be card details collect from user that been tokenized with stripe client-side libraries
                            description : 'Payment for the pizza order'
                                };

                    helpers.payment(payload, function(err){
                    if(!err){
                       console.log("successfully in payment");
                       var orderdetail = {
                               orderId: shoppingcartid,
                             orderDate: new Date(),
                                 email: userEmail,
                           description: 'Order Success',
                                total : totalAmount
                        };
                        var paymentdetail = {
                              currency: 'usd'
                        };

                       //send email upon payment success
                       helpers.sendEmail(orderdetail,paymentdetail, function(err){
                        if(!err){
                            console.log("successfully sent email");
                          // Delete the shopping carts after order been made and success
                          _data.delete('shoppingcarts',shoppingcartid,function(err){
                            if(!err){
                              // Lookup the user's object to get all their shopping cart
                              _data.read('users',userEmail,function(err,userData){
                                if(!err){
                                  var userCarts = typeof(userData.carts) == 'object' && userData.carts instanceof Array ? userData.carts : [];

                                  // Remove the deleted check from their list of checks
                                  var checkPosition = userCarts.indexOf(shoppingcartid);
                                  if(checkPosition > -1){
                                    userCarts.splice(checkPosition,1);
                                    // Re-save the user's data
                                    userData.carts = userCarts;
                                    _data.update('users',userEmail,userData,function(err){
                                      if(!err){
                                        callback(200);
                                      } else {
                                        callback(500,{'Error' : 'Could not update the user.'});
                                      }
                                    });
                                  } else {
                                    callback(500,{"Error" : "Could not find the check on the user's object, so could not remove it."});
                                  }
                                } else {
                                  callback(500,{"Error" : "Could not find the user who created the shopping cart, so could not remove the cart from the list of checks on their user object."});
                                }
                              });
                            } else {
                              callback(500,{"Error" : "Could not delete the check data."})
                            }
                          });

                        } else {
                          callback(400, { 'Error': 'There was an error sending the email' });
                        }
                       });

                    } else{
                       callback(400, { 'Error': 'There was an error processing the payment' });
                    }
                    });
                  } else {
                    callback(500,{"Error": "invalid qty & amount reading from shopping carts"});
                  }
               });
            } else {
                callback(400,{"Error" : "not the user shopping cart id"});
            }
          } else {
             callback(500,{"Error" : "Could not read the user data."});
          }
        });
        } else {
            callback(500,{"Error" : "Could not find the user by this token."});
        }
      });
  } else {
      callback(400,{"Error" : "Missing valid shopping cart id"});
  }
};


// Export the handlers
module.exports = handlers;
