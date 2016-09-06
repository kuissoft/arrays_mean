//
//
// Constants
var isDev = process.env.NODE_ENV == 'development' ? true : false;
//
//
//
// Initialize application object for context
//
var dotenv_path = __dirname + "/../config/env/.env." + process.env.NODE_ENV;
var dotenv_config =
{
    path: dotenv_path
};
require('dotenv').config(dotenv_config);
var path = require('path');
var express = require('express');
var winston = require('winston');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var session = require('express-session');

// This will configure Passport to use Auth0
var strategy = require('./setup-passport');

var app = express();
//
//
// Set up application runtime object graph
//
var context = require('./app_context').NewHydratedContext(app);
// module.exports = context; // access app at context.app
//
//
// Configure app
//
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
var nunjucks = require('express-nunjucks');
var nunjucks_config = 
{
    watch: isDev,
    noCache: isDev,
};
nunjucks.setup(nunjucks_config, app).then(require('./nunjucks/filters'));
//
//
app.use(context.logging.requestLogger);
app.use(require('serve-favicon')(__dirname + '/public/images/favicon.ico'));
app.use(express.static(path.join(__dirname, '/public')));
app.use(bodyParser.urlencoded({ extended: false })); // application/x-www-form-urlencoded
app.use(bodyParser.json()); // application/JSON
app.use(require('compression')());
app.set('trust proxy', true);
var helmet = require('helmet');
app.use(helmet.xframe());
app.use(cookieParser());
app.use(session({
    secret: 'djU18Hkl3V7Jb7p96l3v7MA31PZX7dwS4_y6J_uURxf03Ed-32g6YvHrf-sHw2d5P',
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
//
//
var mongoose_client = require('../lib/mongoose_client/mongoose_client');
var modelNames = [];
modelNames.push(context.raw_source_documents_controller.ModelName);
mongoose_client.FromApp_Init_IndexesMustBeBuiltForSchemaWithModelsNamed(modelNames)
//
mongoose_client.WhenMongoDBConnected(function() 
{
    mongoose_client.WhenIndexesHaveBeenBuilt(function() 
    {
        _mountRoutesAndStartListening();
    });
});
//
function _mountRoutesAndStartListening()
{
    winston.info("💬  Proceeding to boot app.");
    //
    context.routes_controller.MountRoutes();
    //
    // Run actual server
    if (module === require.main) {
        var server = app.listen(process.env.PORT || 9080, function () {
            var host = isDev ? 'localhost' : server.address().address;
            var port = server.address().port;
            winston.info('📡  App listening at %s:%s', host, port);
        });
    }
}
//