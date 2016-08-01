var express             = require('express');
var bodyParser          = require('body-parser');
var mongoose            = require('mongoose');
var _                   = require('underscore');


var app = express();
var PORT = process.env.PORT || 3000; // process.env.PORT - heroku port


mongoose.Promise = global.Promise;//REMOVE WARNING
mongoose.connect('mongodb://localhost/todo-mongo'); // connect to database
var Todo   = require('./models/todo.js');


//add bodyParser as middleware to app
app.use(bodyParser.json());


app.get('/', function (req, res) {
	res.send('Todo api Root is working');
});



//====================================================================
//GET all todos or filtered  /todos?completed=false&q=haircut
//app.get('/todos', middleware.requireAuthentication, function (req, res) {

	// var query = req.query;//req.query give us string not boolean,
	// var where = {};

	//Filter todos with just current user 
	// where = {
	// 	 userId: req.user.get('id') // we access req.user that we assign in middleware
	// };


	//Work With q Query    /todos?completed=false
	// if (query.hasOwnProperty('completed') && query.completed === 'false') {
	// 	where.completed = false;
	// } else if (query.hasOwnProperty('completed') && query.completed === 'true') {
	// 	where.completed = true;
	// }




	//Work With 'q' Query    /todos?q=something
	// if (query.hasOwnProperty('q') && query.q.length > 0) {
	// 	where.description = {
	// 		$like: '%' + query.q + '%',
	// 	};
	// }

	// //FETCH FROM SQLITE
	// db.todo.findAll({where: where}).then(function (sqTodos) {

	// 	res.json(sqTodos);//response as json no need to stringify

	// }, function (e) {
	// 	res.status(500).send();//500 status - server error
	// });

//});
//=====================================================================





//=====================================================================
//POST todo
app.post('/todos', function (req, res) {

// ////////////WITH DATABASE REFACTOR////////////////
// 	//req.body - Body requested
// 	//_.pick - filter body with 'description' and 'completed' properties
	// var body = _.pick(req.body, 'description', 'completed');

// 	db.todo.create(body).then(function (todo) {

// 		req.user.addTodo(todo).then(function () {
// 			//Add todo to that user by adding users 'id' into 'userId' 
// 			return todo.reload();
// 		}).then(function (todo) {
// 			res.json(todo.toJSON());
// 		});

// 	}, function (e) {
		// res.status(400).json(e);
// 	});


    //
	var body = _.pick(req.body, 'description', 'completed', 'priority');

    // console.log('--------------Body-----------------');
    // console.log(req.body);
    // console.log('-----------------------------------');




    // Create Todo
    var todo = new Todo({ 
        description: body.description, 
        completed: body.completed, 
        priority: body.priority
    });

  // save Todo
  todo.save(function(err) {
    if (err) {
      return res.status(404).send();
    }

    console.log('Todo saved successfully');
    res.json(body);
  });


});
//=====================================================================








app.listen(PORT, function () {
    console.log('Listening port: ' + PORT);
});

