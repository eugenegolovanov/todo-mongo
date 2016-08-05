var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var User = require('./models/user.js');
var Token = require('./models/token.js');
var cryptojs = require('crypto-js');

 
var middleware = {
	requireAuthentification: function (req, res, next) {
        // check header or url parameters or post parameters for token
        var token = req.body.token || req.query.token || req.headers['x-access-token'];

        if (token) {

		    var tokenHash = cryptojs.MD5(token).toString();

            //Search token in db
            Token.findOne({'tokenHash' : tokenHash}, function(err, todo) {
                if (err) {
                    return res.status(404).json({"token":"Not Found"});//500 status - server error
                } else {
                    //TOKEN FOUND
                    //Decode back jwt
                    var tokenDecodedJWT = jwt.verify(token, config.jwt);// encoding encoded token
                    var bytes = cryptojs.AES.decrypt(tokenDecodedJWT.token, config.cryptojs);
                    var tokenData = JSON.parse(bytes.toString(cryptojs.enc.Utf8));//{id: user.id}

                    var userId = tokenData.id;//USER ID FROM TOKEN

                    //Search User By extracted Id
                    User.findOne({"_id": userId}, function(err, user) {
                            if(err){
                                return res.status(401).json({"user":"not exists"});
                            }
                        if (!user) {
                            res.json({ success: false, message: 'Authentication failed. User not found.' });
                        } else if (user) {
                            //SUCCESS
                             console.log('++++++++User Authorized+++++++++');
                             next();
                        }
                    });




                }


            });
        } else {
            // if there is no token
            // return an error
            return res.status(403).send({ 
                success: false, 
                message: 'No token provided.' 
            });
            
        }
	}
};


module.exports = middleware;