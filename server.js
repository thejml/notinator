var PORT = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var IPADDRESS = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var MONGOIP = process.env.OPENSHIFT_MONGODB_DB_HOST || '127.0.0.1';
var MONGOPORT = process.env.OPENSHIFT_MONGODB_DB_PORT || 27017;

var mongoose = require ("mongoose"); 
var restify = require ("restify");
var noteSchema = new mongoose.Schema({
	note: { type: String },
	data: { type: String },
	datestamp: { type: Number, min: 0 },
	user: { type: String },
	sharing: { type: Number },
});

var userSchema = new mongoose.Schema({
	username: { type: String, trim: true },
	password: { type: String },
	joindate: { type: Number, min: 0 },
	lastdate: { type: Number, min: 0 } 
});

// // create our configuration object by calling configure based on the environment desired.
//var config = require('./config.js').configure(env);

var note = mongoose.model('Notes', noteSchema);
var users = mongoose.model('Userinfo', userSchema);
	
function addNote(req, res, next) {
	if ((req.params.nname === undefined) || (req.params.uname === undefined)) {
	    return next(new restify.InvalidArgumentError('both User Name and Note Name must be supplied'))
  	}
	var options = {upsert: true};

	// Creating one note.
	var incomingNote = {
	    	name: req.params.nname,
		data: req.body,
		datestamp: Date.now(),
		user: req.params.uname,
		sharing: 1,
	};

	// Saving it to the database.
	note.findOneAndUpdate({ name: req.params.nname, user: req.params.uname }, incomingNote, options, function (err) {
		if (err) {
			console.log('Error on save'+err);
		} else { 
			console.log(Date.now()+' User: '+req.params.uname+' Note: '+req.params.name+' saved!');
  			res.send('Note '+req.params.name+' saved.');
		}
	});
}

function validateUser(input,db) {
	if ((input.username==db.username) && (input.password==db.password)) {
		return true;
	}
}

function displayNote(req,res,next) {
/*	res.send(req.username);
	res.send(req.authorization.basic.password);
	users.find({ username:req.username }, function (err,users) {
		if (validateUser(req.authorization.basic,users)) {
			res.send(req.params.nname+" thanks "+req.params.uname);
		} else { res.send("Sorry, Credentials Denied"); }
	});*/

	note.findOne({ user: req.params.uname, name: req.params.nname },function (err,note) {
		res.send(note.data);
	});
}

function listNotes(req,res,next) { 
	note.find({ user: req.params.uname },{ name: 1, datestamp: 1}, function (err, note) { res.send(note); });
}

function listLatestPerServer(req, res, next) {
	console.log(Date.now()+" User: "+req.params.uname+" Note: "+req.params.name+" queried");

	deployment.find({ server: req.params.name }, null, { sort: { datestamp: -1 } },function(err, deploys) { res.send(deploys); });
}

function displayAllNotes(req,res,next) { }
function deleteNote(req,res,next) { }

var server = restify.createServer();
server.use(restify.bodyParser({ mapParams: true }));
server.use(restify.authorizationParser());
server.get('/note/:uname/all', displayAllNotes);
server.get('/note/:uname/:nname', displayNote);
server.get('/delete/:uname/:nname', deleteNote);
server.post('/add/:uname/:nname', addNote);
server.post('/update/:uname/:nname', addNote);
server.head('/note/:uname/:nname', addNote);
server.get('/list/:uname', listNotes);
// Here we find an appropriate database to connect to, defaulting to
// localhost if we don't find one.
var uristring = 'mongodb://noteuser:myP455word@'+MONGOIP+':'+MONGOPORT+'/notinator';

// Makes connection asynchronously.  Mongoose will queue up database
// operations and release them when the connection is complete.
mongoose.connect(uristring, function (err, res) {
  	if (err) {
  		console.log ('ERROR connecting to: ' + uristring + '. ' + err);
  	} else {
  		console.log ('Succeeded connected to: ' + uristring);

// Deployment Schema setup, Mongo connected, time to start listening

		server.listen(PORT, IPADDRESS, function() {
		  	console.log('%s listening at %s', server.name, server.url);
		});

	}
});
