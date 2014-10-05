var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongo = require('mongodb');
var monk = require('monk');
var password = require('password-hash');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/veracity');
var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
    var Schema = mongoose.Schema;

    var userSchema = mongoose.Schema({
        name: {
            first: String,
            last: String
        },
        email: String,
        admin: Boolean,
        create_time: { type: Date, default: Date.now },
        update_time: { type: Date, default: Date.now }
    });

    var articleSchema = mongoose.Schema({
        author_id: { type: Object, ref: 'userSchema' },
        section: String,
        title: String,
        body: String,
        tags: [String],
        create_time: { type: Date, default: Date.now },
        update_time: { type: Date, default: Date.now }
    });

    var User = mongoose.model('User', userSchema);

    var Article = mongoose.model('Article', articleSchema);

    userSchema.methods.getArticles = function() {
        return mongoose.model('Article').find({author_id: this.id});
    };

    userSchema.virtual('name.full').get(function () {
      return this.name.first + ' ' + this.name.last;
    });

    userSchema.virtual('name.full').set(function (name) {
        var split = name.split(' ');
        this.name.first = split[0];
        this.name.last = split[1];
    });

    var test = new User({
        name: {first: 'Noah', last: 'Conley'},
        email: 'noahkconley@gmail.com',
        admin: true
    });

    test.save(function(err, test) {
        if (err) return console.error(err);
        console.log(test.name.full);
    });
});

var routes = require('./routes/index');
var users = require('./routes/users');
var admin = require('./routes/admin');

var app = express();

var server = app.listen(3000, function() {
    console.log('Listening on port %d', server.address().port)
})

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(req,res,next){
    req.db = db;
    next();
});

app.use('/', routes);
app.use('/users', users);
app.use('/admin', admin);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
