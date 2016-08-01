var express             = require('express');
var bodyParser          = require('body-parser');
var mongoose            = require('mongoose');
var _                   = require('underscore');


var app = express();
var PORT = process.env.PORT || 3000; // process.env.PORT - heroku port

//Mongoose
mongoose.Promise = global.Promise;//REMOVE WARNING
mongoose.connect('mongodb://localhost/todo-mongo'); // connect to database
var Todo = require('./models/todo.js');


//add bodyParser as middleware to app
app.use(bodyParser.json());


app.get('/', function (req, res) {
	res.send('Todo api Root is working');
});





//====================================================================
//GET all todos or filtered  /todos?completed=false&q=haircut
app.get('/todos', function (req, res) {

	var query = req.query;//req.query give us string not boolean,
	var where = {};

	// //Filter todos with just current user 
	// where = {
	// 	 userId: req.user.get('id') // we access req.user that we assign in middleware
	// };


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
           res.json(todos);//response as json no need to stringify
    });



});
//=====================================================================





//=====================================================================
//POST todo
app.post('/todos', function (req, res) {

	var body = _.pick(req.body, 'description', 'completed', 'priority');

	//Check body if properties are valid types
	if (!_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length === 0 || !_.isNumber(body.priority)) {
		return res.status(400).json({ validTypes: false, });//400 - user provided bad data
	}

    // Create Todo
    var todo = new Todo({ 
        description: body.description, 
        completed: body.completed, 
        priority: body.priority
    });

  // Save Todo
  todo.save(function(err) {
    if (err) {
      return res.status(400).json(err);
    }

    console.log('Todo saved successfully');
    res.json(body);
  });


});
//=====================================================================








app.listen(PORT, function () {
    console.log('Listening port: ' + PORT);
});

