/*jshint -W003 */

/**
 * Module dependencies.
 */
var prompt = require('co-prompt')
  , os = require('os')
  , fs = require('fs')
  , mkdirp = require('mkdirp');


/**
 * Create Maglev application at `path`.
 *
 * @param {String} path
 * @api private
 */
exports = module.exports = function create(path) {
  console.log('creating Maglev application at : ' + path);
  
  (function createApplication(path) {
    emptyDirectory(path, function(empty) {
      if (empty) {
        createApplicationAt(path);
      } else {
        prompt.confirm('destination is not empty, continue? ')(function(err, ok) {
          if (err) { throw err; }
          if (ok) {
            process.stdin.destroy();
            createApplicationAt(path);
          } else {
            abort('aborting');
          }
        });
      }
    });
  })(path);
};


var eol = 'win32' == os.platform() ? '\r\n' : '\n';

var userModel = [
    'var maglev = require(\'maglev\')'
  , 'var mongoose = require(\'mongoose\');'
  , 'var Schema = mongoose.Schema;'
  , 'var bCrypt = require(\'../../node_modules/bcrypt-nodejs/bCrypt\');'
  , 'var querystring = require(\'querystring\');'
  , 'var http = require(\'http\');'
  , ''
  , 'var UserSchema = new Schema({'
  , '    firstname: String,'
  , '    lastname: String,'
  , '    username: {type: String, index: {unique: true, dropDups: true}},'
  , '    salt: { type: String},'
  , '    hash: { type: String},'
  , '    email: {type: String, index: {unique: true, dropDups: true}},'
  , '    birthday: Date,'
  , '    roles: [String],'
  , '    gender: String,'
  , '    sex: Number'
  , '});'
  , ''
  , 'UserSchema.virtual(\'password\')'
  , '  .get(function() {'
  , '      return this._password;'
  , '  }).set(function(password) {'
  , '      this._password = password;'
  , '      var salt = this.salt = bCrypt.genSaltSync(10);'
  , '      this.hash = bCrypt.hashSync(password, salt);'
  , '  });'
  , ''
  , 'UserSchema.method(\'checkPassword\', function(password, callback) {'
  , '    bCrypt.compare(password, this.hash, callback);'
  , '});'
  , ''
  , 'UserSchema.static(\'authenticate\', function(username, password, callback) {'
  , '    var that = this;'
  , '    var processCheckPass = function(myuser, mypassword){'
  , '        myuser.checkPassword(mypassword, function(err, passwordCorrect) {'
  , '            if (err)'
  , '                return callback(err);'
  , ''
  , '            if (!passwordCorrect)'
  , '                return callback(null, false);'
  , ''
  , '            return callback(null, myuser);'
  , '        });'
  , '    };'
  , '    this.findOne({username: username}, function(err, user) {'
  , '        if (err)'
  , '            return callback(err);'
  , ''
  , '        if (!user){'
  , '            that.findOne({email: username}, function(err, user) {'
  , '                if (err)'
  , '                    return callback(err);'
  , ''
  , '                if (!user){'
  , '                    return callback(null, false);'
  , '                }'
  , '                processCheckPass(user,password);'
  , '            });'
  , '        }else{'
  , '            processCheckPass(user,password);'
  , '        }'
  , '    });'
  , '});'
  , ''
  , 'module.exports = mongoose.model(\'User\', UserSchema);'
  , ''
].join(eol);

var pagesController = [
    'var maglev = require(\'maglev\')'
  , '  , Controller = maglev.Controller;'
  , ''
  , 'var pagesController = new Controller();'
  , ''
  , 'pagesController.main = function() {'
  , '  this.title = \'Maglev\';'
  , '  this.render();'
  , '}'
  , ''
  , 'module.exports = pagesController;'
  , ''
].join(eol);

var oauthConfig = [
  'module.exports = {'
  , ' facebook: {'
  , '   clientID: \'886295441415353\','
  , '   clientSecret: \'9a7bb2d755d2b0f628f223875d2088b7\','
  , '   callbackURL: \'/auth/facebook/callback\''
  , ' },'
  , ' twitter: {'
  , '   consumerKey: \'Hd3lw7toqdttfBQLiVkrv1lDE\','
  , '   consumerSecret: \'ZOX2HCg4T3oglLHDl8IvD71nbNjgYkUnE2OH6BNIiVY2t0IuI9\','
  , '   callbackURL: "/auth/twitter/callback"'
  , ' },'
  , ' github: {'
  , '   clientID: \'a55510994df28fc475ea\','
  , '   clientSecret: \'a3025c9dc0095d8f83ce0c1b070bcb48c1c398ea\','
  , '   callbackURL: "/auth/github/callback"'
  , ' },'
  , ' google: {'
  , '   clientID: \'592410562823-pbf5qf3194afv3t0jcvk4aaqvmordh8s.apps.googleusercontent.com\','
  , '   clientSecret: \'VrF_fGyilb6KG8h2NEp1l6uV\','
  , '   returnURL: \'/auth/google/callback\''
  , ' }'
  , '}'
].join(eol);

var passportInitializer = [
  'var passport = require(\'passport\');'
  , 'var config = require(\'../oauth\');'
  , 'var BasicStrategy = require(\'passport-http\').BasicStrategy;'
  , 'var LocalStrategy = require(\'passport-local\').Strategy;'
  , 'var FacebookStrategy = require(\'passport-facebook\').Strategy;'
  , 'var TwitterStrategy = require(\'passport-twitter\').Strategy;'
  , 'var GithubStrategy = require(\'passport-github\').Strategy;'
  , 'var GoogleStrategy = require(\'passport-google-oauth\').OAuth2Strategy;'
  , 'var User = require(\'../../app/models/User\');'
  , ''
  , 'passport.use(new BasicStrategy('
  , '  function(userid, password, done) {'
  , '    if (userid == \'YODA\' && password == \'12345678\'){'
  , '      return done(null, {id: \'54d231e57ddb0019b723c023\', username: userid});'
  , '    }else{'
  , '      return done(\'authenticate has failed !\');'
  , '    }'
  , '    // User.findOne({ username: userid }, function (err, user) {'
  , '    //   if (err) { return done(err); }'
  , '    //   if (!user) { return done(null, false); }'
  , '    //   if (!user.verifyPassword(password)) { return done(null, false); }'
  , '    //   return done(null, user);'
  , '    // });'
  , '  }'
  , '));'
  , ''
  , '// Use the LocalStrategy within Passport.'
  , 'passport.use(new LocalStrategy({'
  , '    usernameField: \'username\''
  , '  },'
  , '  function(username, password, done) {'
  , '    // Find the user by username.  If there is no user with the given'
  , '    // username, or the password is not correct, set the user to `false` to'
  , '    // indicate failure.  Otherwise, return the authenticated `user`.'
  , '    User.authenticate(username, password, function(err, user) {'
  , '      return done(err, user);'
  , '    });'
  , '  }'
  , '));'
  , ''
  , '// Use the FacebookStrategy Passport'
  , 'passport.use(new FacebookStrategy({'
  , '    clientID: config.facebook.clientID,'
  , '    clientSecret: config.facebook.clientSecret,'
  , '    callbackURL: config.facebook.callbackURL'
  , '  },'
  , '  function(accessToken, refreshToken, profile, done) {'
  , '    profile = profile._json;'
  , '    console.log(profile);'
  , '    if (profile.email == \'\'){'
  , '      profile.email = \'fb_\' + profile.id;'
  , '    }'
  , '    User.findOne({email:profile.email}, function(err, user){'
  , '      if (err || !user){'
  , '        var user = new User();'
  , '        user.username = \'fb_\' + profile.id;'
  , '        user.email = profile.email;'
  , '        user.cellphone = profile.email;'
  , '        user.firstname = profile.first_name;'
  , '        user.lastname = profile.last_name;'
  , '        user.birthday = new Date(profile.birthday);'
  , '        user.gender = profile.gender;'
  , '        user.save(function(err) {'
  , '            if (err) {'
  , '                console.log(\'error: \' + err);'
  , '                done(err);'
  , '            } else {'
  , '                console.log(\'success\');'
  , '                done(null,user);'
  , '            }'
  , '        });'
  , '      }else{'
  , '        done(null,user);'
  , '      }'
  , '    });'
  , '  }'
  , '));'
  , ''
  , 'passport.use(new TwitterStrategy({'
  , '    consumerKey: config.twitter.consumerKey,'
  , '    consumerSecret: config.twitter.consumerSecret,'
  , '    callbackURL: config.twitter.callbackURL'
  , '  },'
  , '  function(accessToken, refreshToken, profile, done) {'
  , '    console.log(profile);'
  , '    console.log(profile);'
  , '    params = { username: \'tw_\' + profile.id };'
  , '    profile.email = \'tw_\' + profile.id;'
  , '    User.findOne(params, function(err, user){'
  , '      if (err || !user){'
  , '        var user = new User();'
  , '        user.username = \'tw_\' + profile.id;'
  , '        user.email = profile.email;'
  , '        user.cellphone = profile.email;'
  , '        user.firstname = profile.name;'
  , '        user.lastname = profile.screen_name;'
  , '        user.save(function(err) {'
  , '            if (err) {'
  , '                console.log(\'error: \' + err);'
  , '                done(err);'
  , '            } else {'
  , '                console.log(\'success\');'
  , '                done(null,user);'
  , '            }'
  , '        });'
  , '      }else{'
  , '        done(null,user);'
  , '      }'
  , '    });'
  , '  }'
  , '));'
  , 'passport.use(new GithubStrategy({'
  , '    clientID: config.github.clientID,'
  , '    clientSecret: config.github.clientSecret,'
  , '    callbackURL: config.github.callbackURL'
  , '  },'
  , '  function(accessToken, refreshToken, profile, done) {'
  , '    // profile = profile._json;'
  , '    console.log(profile);'
  , '    if (profile.emails[0].value){'
  , '      params = { email: profile.emails[0].value };'
  , '    }else{'
  , '      params = { username: \'gh_\' + profile.username };'
  , '      profile.emails[0].value = \'gh_\' + profile.username;'
  , '    }'
  , '    User.findOne(params, function(err, user){'
  , '      if (err || !user){'
  , '        var user = new User();'
  , '        user.username = \'gb_\' + profile.username;'
  , '        user.email = profile.emails[0].value;'
  , '        user.cellphone = profile.emails[0].value;'
  , '        user.firstname = profile.username;'
  , '        user.lastname = profile.displayName;'
  , '        user.save(function(err) {'
  , '            if (err) {'
  , '                console.log(\'error: \' + err);'
  , '                done(err);'
  , '            } else {'
  , '                console.log(\'success\');'
  , '                done(null,user);'
  , '            }'
  , '        });'
  , '      }else{'
  , '        done(null,user);'
  , '      }'
  , '    });'
  , '  }'
  , '));'
  , 'passport.use(new GoogleStrategy({'
  , '    clientID: config.google.clientID,'
  , '    clientSecret: config.google.clientSecret,'
  , '    callbackURL: config.google.returnURL'
  , '  },'
  , '  function(accessToken, refreshToken, profile, done) {'
  , '    profile = profile._json;'
  , '    console.log(profile);'
  , '    User.findOne({email:profile.email}, function(err, user){'
  , '      if (err || !user){'
  , '        var user = new User();'
  , '        user.username = \'gb_\' + profile.id;'
  , '        user.email = profile.email;'
  , '        user.cellphone = profile.email;'
  , '        user.firstname = profile.given_name;'
  , '        user.lastname = profile.family_name;'
  , '        if (typeof(profile.birthday) != \'undefined\'){'
  , '          user.birthday = new Date(profile.birthday);'
  , '        }'
  , '        user.gender = profile.gender;'
  , '        user.save(function(err) {'
  , '            if (err) {'
  , '                console.log(\'error: \' + err);'
  , '                done(err);'
  , '            } else {'
  , '                console.log(\'success\');'
  , '                done(null,user);'
  , '            }'
  , '        });'
  , '      }else{'
  , '        done(null,user);'
  , '      }'
  , '    });'
  , '  }'
  , '));'
  , ''
  , '// Passport session setup.'
  , 'passport.serializeUser(function(user, done) {'
  , '  done(null, user.id);'
  , '});'
  , ''
  , 'passport.deserializeUser(function(id, done) {'
  , '  User.findById(id, function (err, user) {'
  , '    done(err, user);'
  , '  });'
  , '});'
].join(eol);

var mongooseInitializer = [
  'var mongoose = require("mongoose");'
  , 'module.exports = function() {'
  , '  switch (this.env) {'
  , '    case \'development\':'
  , '      mongoose.connect(\'mongodb://127.0.0.1/db\');'
  , '      break;'
  , '    case \'production\':'
  , '      mongoose.connect(\'mongodb://user:pass@host.com:port/db\');'
  , '      break;'
  , '  }'
  , '}'
].join(eol);

var mainTemplate = [
    '<!DOCTYPE html>'
  , '<html>'
  , '  <head>'
  , '    <title><%= title %></title>'
  , '    <link rel="stylesheet" href="/stylesheets/screen.css" />'
  , '  </head>'
  , '  <body>'
  , '    <h1><%= title %></h1>'
  , '    <p>Welcome aboard! Visit the <a href="https://github.com/viadeo/maglev">GitHub project page</a> for details.</p>'
  , '  </body>'
  , '</html>'
].join(eol);

var cssStylesheet = [
    'body {'
  , '  padding: 50px;'
  , '  font: 14px "Lucida Grande", Helvetica, Arial, sans-serif;'
  , '}'
  , ''
  , 'a {'
  , '  color: #00B7FF;'
  , '}'
].join(eol);

var routesTemplate = [
    '// Draw routes.  Maglev\'s router provides expressive syntax for drawing'
  , '// routes, including support for resourceful routes, namespaces, and nesting.'
  , '// MVC routes can be mapped to controllers using convenient'
  , '// `controller#action` shorthand.  Standard middleware in the form of'
  , '// `function(req, res, next)` is also fully supported.  Consult the Maglev'
  , '// Guide on [routing](http://maglevjs.org/guide/routing.html) for additional'
  , '// information.'
  , 'module.exports = function routes() {'
  , '  this.root(\'pages#main\');'
  , '}'
  , ''
].join(eol);

var allEnvironments = [
    'var express = require(\'express\');'
  , 'var passport = require(\'passport\');'
  , ''
  , 'module.exports = function() {'
  , '  // Warn of version mismatch between global "lcm" binary and local installation'
  , '  // of Maglev.'
  , '  if (this.version !== require(\'maglev\').version) {'
  , '    console.warn(\'version mismatch between local (%s) and global (%s) Maglev module\', require(\'maglev\').version, this.version);'
  , '  }'
  , ''
  , '  this.use(passport.initialize());'
  , '  this.use(passport.session());'
  , '  this.datastore(require(\'locomotive-mongoose\'));'
  , '}'
  , ''
].join(eol);

var developmentEnvironment = [
    'module.exports = function() {'
  , ' global.PUBULIC_DIR = \'/../../../maglev_frontend/app\';'
  , ' global.DEFAULT_TPL = \'pages/main\';'
  , '}'
  , ''
].join(eol);

var productionEnvironment = [
    'module.exports = function() {'
  , ' global.PUBULIC_DIR = \'/../../public\';'
  , ' global.DEFAULT_TPL = \'pages/main\';'
  , '}'
  , ''
].join(eol);

var genericInitializer = [
    'module.exports = function() {'
  , '  // Any files in this directory will be `require()`\'ed when the application'
  , '  // starts, and the exported function will be invoked with a `this` context of'
  , '  // the application itself.  Initializers are used to connect to databases and'
  , '  // message queues, and configure sub-systems such as authentication.'
  , ''
  , '  // Async initializers are declared by exporting `function(done) { /*...*/ }`.'
  , '  // `done` is a callback which must be invoked when the initializer is'
  , '  // finished.  Initializers are invoked sequentially, ensuring that the'
  , '  // previous one has completed before the next one executes.'
  , '}'
  , ''
].join(eol);

var mimeInitializer = [
    'module.exports = function() {'
  , '  // Define custom MIME types.  Consult the mime module [documentation](https://github.com/broofa/node-mime)'
  , '  // for additional information.'
  , '  /*'
  , '  this.mime.define({'
  , '    \'application/x-foo\': [\'foo\']'
  , '  });'
  , '  */'
  , '}'
  , ''
].join(eol);

var viewsInitializer = [
    'module.exports = function() {'
  , '  // Configure view-related settings.  Consult the Express API Reference for a'
  , '  // list of the available [settings](http://expressjs.com/api.html#app-settings).'
  , '  this.set(\'views\', __dirname + \'/../../app/views\');'
  , '  this.set(\'view engine\', \'ejs\');'
  , ''
  , '  // Register EJS as a template engine.'
  , '  this.engine(\'ejs\', require(\'ejs\').__express);'
  , ''
  , '  // Override default template extension.  By default, Maglev finds'
  , '  // templates using the `name.format.engine` convention, for example'
  , '  // `index.html.ejs`  For some template engines, such as Jade, that find'
  , '  // layouts using a `layout.engine` notation, this results in mixed conventions'
  , '  // that can cause confusion.  If this occurs, you can map an explicit'
  , '  // extension to a format.'
  , '  /* this.format(\'html\', { extension: \'.jade\' }) */'
  , ''
  , '  // Register formats for content negotiation.  Using content negotiation,'
  , '  // different formats can be served as needed by different clients.  For'
  , '  // example, a browser is sent an HTML response, while an API client is sent a'
  , '  // JSON or XML response.'
  , '  /* this.format(\'xml\', { engine: \'xmlb\' }); */'
  , '}'
  , ''
].join(eol);

var middlewareInitializer = [
    'var express = require(\'express\')'
  , '  , poweredBy = require(\'connect-powered-by\')'
  , '  , bodyParser = require(\'body-parser\')'
  , '  , methodOverride = require(\'method-override\')'
  , '  , errorHandler = require(\'errorhandler\');'
  , ''
  , 'module.exports = function() {'
  , '  // Use middleware.  Standard [Connect](http://www.senchalabs.org/connect/)'
  , '  // middleware is built-in, with additional [third-party](https://github.com/senchalabs/connect/wiki)'
  , '  // middleware available as separate modules.'
  , '  if (\'development\' == this.env) {'
  , '    this.use(require(\'morgan\')());'
  , '  }'
  , ''
  , '  this.use(poweredBy(\'Yoda Solution\'));'
  , '  this.use(express.static(__dirname  + PUBULIC_DIR));'
  , '  this.use(methodOverride());'
  , '  this.use(bodyParser.json());'
  , '  this.use(bodyParser.urlencoded({}));'
  , '  this.use(this.router);'
  , '  this.use(errorHandler());'
  , '}'
  , ''
].join(eol);

var serverJS = [
    'var maglev = require(\'maglev\')'
  , '  , bootable = require(\'bootable\');'
  , ''
  , '// Create a new application and initialize it with *required* support for'
  , '// controllers and views.  Move (or remove) these lines at your own peril.'
  , 'var app = new maglev.Application();'
  , 'app.phase(maglev.boot.controllers(__dirname + \'/app/controllers\'));'
  , 'app.phase(maglev.boot.views());'
  , ''
  , '// Add phases to configure environments, run initializers, draw routes, and'
  , '// start an HTTP server.  Additional phases can be inserted as needed, which'
  , '// is particularly useful if your application handles upgrades from HTTP to'
  , '// other protocols such as WebSocket.'
  , 'app.phase(require(\'bootable-environment\')(__dirname + \'/config/environments\'));'
  , 'app.phase(bootable.initializers(__dirname + \'/config/initializers\'));'
  , 'app.phase(maglev.boot.routes(__dirname + \'/config/routes\'));'
  , 'app.phase(maglev.boot.httpServer(process.env.PORT||3000, \'0.0.0.0\'));'
  , ''
  , '// Boot the application.  The phases registered above will be executed'
  , '// sequentially, resulting in a fully initialized server that is listening'
  , '// for requests.'
  , 'app.boot(function(err) {'
  , '  if (err) {'
  , '    console.error(err.message);'
  , '    console.error(err.stack);'
  , '    return process.exit(-1);'
  , '  }'
  , '});'
  , ''
].join(eol);

var packageJSON = [
    '{'
  , '  "name": "app-name",'
  , '  "version": "0.0.1",'
  , '  "private": true,'
  , '  "dependencies": {'
  , '    "maglev": "viadeo/maglev#v0.6.3",'
  , '    "bootable": "0.2.x",'
  , '    "bootable-environment": "0.2.x",'
  , '    "express": "4.x.x",'
  , '    "connect-powered-by": "0.1.x",'
  , '    "ejs": "0.8.x",'
  , '    "morgan": "1.x.x",'
  , '    "body-parser": "1.x.x",'
  , '    "method-override": "1.x.x",'
  , '    "errorhandler": "1.x.x",'
  , '    "gm": "1.16.0",'
  , '    "imagemagick": "0.1.3",'
  , '    "mongoose": "3.8.x",'
    '    "locomotive-mongoose": "0.1.x",'
    '    "mv": "2.0.0",'
    '    "passport": "0.2.x",'
    '    "passport-facebook": "^1.0.3",'
    '    "passport-github": "^0.1.5",'
    '    "passport-google-oauth": "^0.1.5",'
    '    "passport-http": "^0.2.2",'
    '    "passport-local": "1.0.x",'
    '    "passport-twitter": "^1.0.2",'
    '    "querystring": "0.2.0",'
    '    "request": "^2.65.0",'
    '    "should": "3.1.x",'
    '    "bcrypt-nodejs": "0.0.x"'
  , '  },'
  , '  "scripts": {'
  , '    "start": "node server.js"'
  , '  }'
  , '}'
  , ''
].join(eol);

/**
 * Create application at the given directory `path`.
 *
 * @param {String} path
 */
function createApplicationAt(path) {
  console.log();
  process.on('exit', function(){
    console.log();
    console.log('   install dependencies:');
    console.log('     $ cd %s && npm install', path);
    console.log();
    console.log('   run the app:');
    console.log('     $ node server');
    console.log();
  });
  
  mkdir(path, function() {
    mkdir(path + '/app');
    mkdir(path + '/app/controllers', function(){
      write(path + '/app/controllers/pagesController.js', pagesController);
    });
    mkdir(path + '/app/models', function(){
      write(path + '/app/models/User.js', userModel);
    });
    mkdir(path + '/app/views');
    mkdir(path + '/app/views/pages', function(){
      write(path + '/app/views/pages/main.html.ejs', mainTemplate);
    });
    
    mkdir(path + '/config', function(){
      write(path + '/config/routes.js', routesTemplate);
      write(path + '/config/oauth.js', oauthConfig);
    });
    mkdir(path + '/config/environments', function(){
      write(path + '/config/environments/all.js', allEnvironments);
      write(path + '/config/environments/development.js', developmentEnvironment);
      write(path + '/config/environments/production.js', productionEnvironment);
    });
    mkdir(path + '/config/initializers', function(){
      write(path + '/config/initializers/00_generic.js', genericInitializer);
      write(path + '/config/initializers/01_mime.js', mimeInitializer);
      write(path + '/config/initializers/02_views.js', viewsInitializer);
      write(path + '/config/initializers/03_passport.js', passportInitializer);
      write(path + '/config/initializers/04_mongoose.js', mongooseInitializer);
      write(path + '/config/initializers/30_middleware.js', middlewareInitializer);
    });
    
    mkdir(path + '/public');
    mkdir(path + '/public/stylesheets', function(){
      write(path + '/public/stylesheets/screen.css', cssStylesheet);
    });
    
    write(path + '/package.json', packageJSON);
    write(path + '/server.js', serverJS);
  });
}

/**
 * Check if the given directory `path` is empty.
 *
 * @param {String} path
 * @param {Function} fn
 */
function emptyDirectory(path, fn) {
  fs.readdir(path, function(err, files){
    if (err && 'ENOENT' != err.code) { throw err; }
    fn(!files || !files.length);
  });
}

/**
 * Mkdir -p.
 *
 * @param {String} path
 * @param {Function} fn
 */
function mkdir(path, fn) {
  mkdirp(path, 0755, function(err){
    if (err) { throw err; }
    console.log('   \033[36mcreate\033[0m : ' + path);
    if (fn) {
      fn();
    }
  });
}

/**
 * echo str > path.
 *
 * @param {String} path
 * @param {String} str
 */
function write(path, str) {
  fs.writeFile(path, str);
  console.log('   \x1b[36mcreate\x1b[0m : ' + path);
}

/**
 * Exit with the given `str`.
 *
 * @param {String} str
 */
function abort(str) {
  console.error(str);
  process.exit(1);
}
