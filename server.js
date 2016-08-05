var express             = require('express');
var bodyParser          = require('body-parser');
var mongoose            = require('mongoose');
var _                   = require('underscore');
var jwt    				= require('jsonwebtoken'); // used to create, sign, and verify tokens
var cryptojs 			= require('crypto-js');

var app = express();
var PORT = process.env.PORT || 3000; // process.env.PORT - heroku port

//Mongoose
mongoose.Promise = global.Promise;//REMOVE WARNING
mongoose.connect('mongodb://localhost/todo-mongo'); // connect to database
var Todo = require('./models/todo.js');
var User = require('./models/user.js');
var Token = require('./models/token.js');


var middleware = require('./middleware.js');
var config = require('./config'); // get our config file

//add bodyParser as middleware to app
app.use(bodyParser.json());


app.get('/', function (req, res) {
	res.send('Todo api Root is working');
});





//====================================================================
//GET all todos or filtered  /todos?completed=false&q=haircut
app.get('/todos', middleware.requireAuthentification, function (req, res) {

	var query = req.query;//req.query give us string not boolean,
	var where = {};

	//Filter todos with just current user 
	where = {
		 userId: req.user.get('_id') // we access req.user that we assign in middleware
	};


	//Work With q Query    /todos?completed=false
	if (query.hasOwnProperty('completed') && query.completed === 'false') {
		where.completed = false;
	} else if (query.hasOwnProperty('completed') && query.completed === 'true') {
		where.completed = true;
	}



	//Work With 'q' Query    /todos?q=something
	if (query.hasOwnProperty('q') && query.q.length > 0) {
		where.description = {
            "$regex": query.q, "$options": "i"
		};
	}

    console.log('--------------------------------------------------');
    console.log(where);
    console.log('--------------------------------------------------');


    //Query from Mongo
    Todo.find(where, function(err, todos) {
        if (err) {
        return res.status(500).json(err);//500 status - server error
        }
        res.status(200).json(todos);//response as json no need to stringify
    });



});
//=====================================================================





//=====================================================================
//POST todo
app.post('/todos', middleware.requireAuthentification, function (req, res) {

	var body = _.pick(req.body, 'description', 'completed', 'priority');

	//Check body if properties are valid types
	if (!_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length === 0 || !_.isNumber(body.priority)) {
		return res.status(400).json({ validTypes: false, });//400 - user provided bad data
	}

    // Create Todo
    var todo = new Todo({ 
        description: body.description, 
        completed: body.completed, 
        priority: body.priority,
		userId : req.user.get('_id')
    });

  // Save Todo
  todo.save(function(err) {
    if (err) {
      return res.status(400).json(err);
    }

    console.log('Todo saved successfully');
    res.status(200).json(todo);
  });


});
//=====================================================================




//=====================================================================
//GET todos by id   /todos/:id
app.get('/todos/:id', middleware.requireAuthentification, function (req, res) {

        //Query from Mongo
        Todo.findOne({
			'_id' : req.params.id,
			 'userId': req.user.get('_id')
		}, function(err, todo) {
            if (err) {
           		 // return res.status(500).json(err);//500 status - server error
            	return res.status(404).json({"todo":"Not Found"});
            } else {

				if (typeof todo !== 'undefined' && todo !== null) {
					return res.status(200).json(todo);//response as json no need to stringify
				} else {
            		return res.status(401).json({"todo":"Not Found"});
				}

			}
        });

});
//=====================================================================




//=====================================================================
//DELETE todos by id   /todos/:id
app.delete('/todos/:id', middleware.requireAuthentification, function (req, res) {

	    //Query from Mongo
        Todo.findOne({
			'_id' : req.params.id,
			 'userId': req.user.get('_id')
		}, function(err, todo) {
            if (err) {
            	return res.status(404).json({"todo":"Not Found"});
            } else {

				if (typeof todo !== 'undefined' && todo !== null) {

					//REMOVE
					todo.remove({}, function(err) {
						if (err) {
							return res.status(404).json({"todo":"Not Found"});
						} else {
							return res.status(200).json({"todo":"Successfully Removed"});
						}
					});

				} else {
            		return res.status(401).json({"todo":"Not Found"});
				}

			}
        });


});


//=====================================================================








//=====================================================================
//PUT todos by id /todos/:id,  (update todos)
app.put('/todos/:id', middleware.requireAuthentification, function (req, res) {

	//req.body - Body requested
	//_.pick - filter body with 'description' and 'completed' properties
	var body = _.pick(req.body, 'description', 'completed', 'priority');
	var requestedId = parseInt(req.params.id, 10); //parseInt converts string to Int
	var attributes = {};

	//completed attribute
	if (body.hasOwnProperty('completed')) {
		//success, user provided attribute and it is boolean
		attributes.completed = body.completed;
	} 

	//description attribute
	if (body.hasOwnProperty('description')) {
		//success, user provided attribute and it is string
		attributes.description = body.description.trim();
	} 

    //priority attribute
	if (body.hasOwnProperty('priority')) {
		//success, user provided attribute and it is string
		attributes.priority = body.priority;
	} 


    //Find and Update
    Todo.findOneAndUpdate({
			'_id' : req.params.id,
			 'userId': req.user.get('_id')
		}, {$set:attributes}, {new: true}, function(err, todo){
        if(err){
            return res.status(404).json({"todo":"Not Updated"});//500 status - server error
        } else {

				if (typeof todo !== 'undefined' && todo !== null) {
					return res.status(200).json(todo);
				} else {
            		return res.status(401).json({"todo":"Not Found"});
				}

		}

    });


});
//=====================================================================







////////////////////////////////////////////////////////////////////////
/////////////////////USER///////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

//=====================================================================
//POST /users
app.post('/users', function (req, res) {

	//req.body - Body requested
	//_.pick - filter body with 'email' and 'password' properties
	var body = _.pick(req.body, 'email', 'password');

	// db.user.create(body).then(function (user) {
	// 	res.json(user.toPublicJSON()) //toPublicJSON - method from user.js, works in instanceMethods
	// }, function (e) {
	// 	res.status(400).json(e);
	// });



	// create a user a new user
	var user = new User({
		email: body.email,
		password: body.password
	});

	//save user to database
	user.save(function(err) {
        if(err){
            return res.status(404).json(err);
        }
        res.status(200).json({"signed up successfully": body.password});
	});

});

//=====================================================================



//=====================================================================
//POST users/login
app.post('/users/login', function (req, res) {

	//req.body - Body requested
	//_.pick - filter body with 'email' and 'password' properties
	var body = _.pick(req.body, 'email', 'password');
	var userInstance;

	//All functionality is in user.js file in  'authenticate' method
	// db.user.authenticate(body).then(function (user) {

	// 	var token = user.generateToken('authentication');
	// 	userInstance = user;

	// 	return db.token.create({
	// 		token: token
	// 	});

	// }).then(function (tokenInstance) {
	// 	res.header('Auth', tokenInstance.get('token')).json(userInstance.toPublicJSON());
	// }).catch(function () {
	// 	res.status(401).send();
	// });



	  // find the user
  User.findOne({email: req.body.email}, function(err, user) {
        if(err){
            return res.status(500).json({"error":"server error"});
        }

    if (!user) {
      	res.json({ success: false, message: 'Authentication failed. User not found.' });
    } else if (user) {

		// test a matching password
		user.comparePassword(body.password, function(err, isMatch) {
			if(err){
				return res.status(500).json({"error":"server error"});
			}
			if (isMatch){
       		 	// res.status(200).json({"Logged in Successfully": body.email});

				 //TOKEN
				try {
					//stringData takes 'id' and 'type' and convert is to string for encryption
					var stringData = JSON.stringify({id: user.id});
					var encryptedData = cryptojs.AES.encrypt(stringData, config.cryptojs).toString();//'abc123!@#!' - crypto-js password

					var tokenEncodedJWT = jwt.sign({token: encryptedData}, config.jwt);//'qwerty098' - jwt password

						//----------------------------------
						// Create and Save TOKEN
						var token = new Token({
							tokenHash: tokenEncodedJWT
						});
						//save token to database
						token.save(function(err) {
							if(err){
								return res.status(404).json(err);
							}
							res.status(200).json({"signed up successfully": tokenEncodedJWT});
						});
						//----------------------------------

				} catch (e) {
					return res.status(500).json({"error":"token error"});
				}

			} else {
       		 	res.status(401).json({"Login error": "password not match"});
			}
		});


    }

  });



});
//=====================================================================




app.listen(PORT, function () {
    console.log('Listening port: ' + PORT);
});

