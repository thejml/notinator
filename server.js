var PORT = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var IPADDRESS = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
var MONGOIP = process.env.OPENSHIFT_MONGODB_DB_HOST || '127.0.0.1';
var MONGOPORT = process.env.OPENSHIFT_MONGODB_DB_PORT || 27017;

var mongoose = require ("mongoose"); 
var restify = require ("restify");
var deploySchema = new mongoose.Schema({
	data: { type: String, trim: true },
	datestamp: { type: Number, min: 0 },
	user: { type: String },
	sharing: { type: Number },
});
// Get environment currently running under
var env = "live";
// // create our configuration object by calling configure based on the environment desired.
var config = require('./config.js').configure(env);

var deployment = mongoose.model('Deployments', deploySchema);
	
function addNote(req, res, next) {
	console.log(req.params);	
	if (req.params.server === undefined) {
	    return next(new restify.InvalidArgumentError('Server must be supplied'))
  	}
	var options = {upsert: true};
//	var latest=deployment.aggregate([{ $group: {_id: { server: req.params.server }, mostRecent: { $max: "$datestamp"}}}]);
// Do we have one in here already?
	// Creating one user.
	var incomingDeployment = {
		release: req.params.release,
		datestamp: Date.now(),
		md5: req.params.md5,
		location: req.params.location,
  		codebase: req.params.codebase,
		server: req.params.server,
		success: 1,
		environment: req.params.name
	};

	// Saving it to the database.
	deployment.findOneAndUpdate({ server: req.params.server, release: req.params.release, codebase: req.params.codebase }, incomingDeployment, options, function (err) {
		if (err) {console.log('Error on save'+err);} else { console.log('Saved!');}
	});
  	res.send('Thanks ' + req.params.server);
}

function displayNote(req,res,next) {
	res.send(req.params.nname+" thanks "+req.params.uname);
//	return deployment.aggregate({key: {"server":1},reduce: function (curr,result) {result.total++; if(curr.datestamp>result.datestamp) { result.datestamp=curr.datestamp;} },initial: {total:0, datestamp: 0} });
}

function listLatestPerServer(req, res, next) {
	console.log("Quering..."+req.params.name);

	deployment.find({ server: req.params.name }, null, { sort: { datestamp: -1 } },function(err, deploys) { res.send(deploys); });
}

function displayAllNotes(req,res,next) { }
function deleteNote(req,res,next) { }

var server = restify.createServer();
server.use(restify.bodyParser());
server.get('/note/_all', displayAllNotes);
server.get('/note/:uname/:nname', displayNote);
server.get('/delete/:uname', deleteNote);
server.post('/add/:uname', addNote);
server.post('/update/:uname', addNote);
server.head('/note/:uname', addNote);

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
