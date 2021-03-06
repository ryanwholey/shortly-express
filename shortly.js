var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

// var cookieParser = require('cookie-parser');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());

// Parse JSON (uniform resource locators)
app.use(bodyParser.json());

// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));


// app.use(cookieParser());

app.use(session({
  secret: 'RYAN AND BEN <3',
  resave: false,
  saveUninitialized: false,
  cookie: {}
}))

var authenticator = function(req, res, next){
  if(req.session.user){
    next();
  }else{
    res.redirect(302, 'login')
  }
}

app.get('/', function(req, res) {
  res.redirect(302,'/login');
});

app.get('/signup', 
function(req, res) {
  res.render('signup');
});

app.get('/login', function(req, res){
  res.render('login');
});

app.get('/index', authenticator, function(req, res){
  res.render('index');
});

app.post('/signup', function(req,res){
  Users.create({
    username: req.body.username,
    password: req.body.password
  });
  res.redirect('/login');
});

app.get('/create', authenticator,
function(req, res) {
  res.redirect(302,'/index');
});

app.get('/links', authenticator,
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        Links.create({
          url: uri,
          title: title,
          base_url: req.headers.origin
        })
        .then(function(newLink) {
          res.send(200, newLink);
        });
      });
    }
  });
});



/************************************************************/
// Write your authentication routes here
/************************************************************/

app.post('/login',  // changes to login 
function(req, res) {
  // capture the visitor's login info
  var username = req.body.username;
  var password = req.body.password;

  // instantiate a new user upon clicking Login
  // fetch info from db and compare to inputted info 
  new User({ username: username }).fetch().then(function(found) {
    
    // if the login info does exist in the db
    if (found) {

      // rehash with visitor's input info + salt from the db
      var salt = found.attributes.salt;
      var hash = bcrypt.hashSync(password, salt);

      // if the new hash equals the password in the db
      if (hash === found.attributes.password) {
        req.session.user = username;
        // console.log(req.session);
        // then redirect to index
        res.redirect(302, 'index');
      
      // otherwise, tell visitor his login info is wrong
      } else {
        console.error('Yo bad pw homie');
        
      }

    // tell user his login info doesnt exist
    } else {
      res.redirect(420, '/login')
      console.error('Yo shit don\'t exist homie');     
      
    }
  });
});


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits')+1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
