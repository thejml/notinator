var PORT = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var IPADDRESS = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var MONGOIP = process.env.OPENSHIFT_MONGODB_DB_HOST || '127.0.0.1';
var MONGOPORT = process.env.OPENSHIFT_MONGODB_DB_PORT || 27017;

var mongoose = require ("mongoose"); 
var restify = require ("restify");
var deploySchema = new mongoose.Schema({
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

var deployment = mongoose.model('Deployments', deploySchema);
var users = mongoose.model('Userinfo', userSchema);
	
function addNote(req, res, next) {
    console.log("Note: %j",req.body);
	if ((req.params.nname === undefined) || (req.params.uname === undefined)) {
	    return next(new restify.InvalidArgumentError('both User Name and Note Name must be supplied'))
  	}
	var options = {upsert: true};
//	var latest=deployment.aggregate([{ $group: {_id: { server: req.params.server }, mostRecent: { $max: "$datestamp"}}}]);
// Do we have one in here already?
	// Creating one user.
	var incomingNote = {
	    name: req.params.nname,
		data: req.body,
		datestamp: Date.now(),
		user: req.params.uname,
		sharing: 1,
	};

	// Saving it to the database.
	deployment.findOneAndUpdate({ name: req.params.nname, user: req.params.uname }, incomingNote, options, function (err) {
		if (err) {console.log('Error on save'+err);} else { console.log('Saved!');}
	});
  	res.send('Note '+req.body+' saved.');
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

console.log(req.params.uname+" "+req.params.nname);
	deployment.find({ user: req.params.uname, name: req.params.nname },function (err,note) {
		console.log("Found %j",note.data);
		res.send(note.data+note.datestamp+note.name);
	});
	
	//	return deployment.aggregate({key: {"server":1},reduce: function (curr,result) {result.total++; if(curr.datestamp>result.datestamp) { result.datestamp=curr.datestamp;} },initial: {total:0, datestamp: 0} });
}

function listLatestPerServer(req, res, next) {
	console.log("Quering..."+req.params.name);

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
