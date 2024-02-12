const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const app = express();
const router = express.Router();
const http = require('http');
const https = require('https');
const config = require('./config/index.js');
const session = require('cookie-session');
const mongoose = require('mongoose');
const cors = require("cors")
require('./cron/index.js');
app.use(cors())
app.use(
    session({
        secret: config.sessionSecret,
        resave: false,
        saveUninitialized: true
    })
);

// app.use(function(req, res, next) {
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
//     next();
// });

//require('./routes/game-api')(router);
const server = http.createServer(app);
const socket = require('socket.io')(server);
require('./socket/index.js')(socket);

require('./routes/admin-panel.js')(router, socket);
require('./routes/index')(router);

app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('.html', require('ejs').renderFile);

app.use(
    bodyParser.urlencoded({
        extended: true,
        type: 'application/x-www-form-urlencoded'
    })
);

app.use(fileUpload());
app.use(bodyParser.json());
app.use('/', router);

// SSL code
// var certificate = fs.readFileSync( path.join(__dirname,'../SSL/certificate.crt'), 'utf8');
// var privateKey = fs.readFileSync(path.join(__dirname,'../SSL/private.key'), 'utf8');
// var chain = fs.readFileSync(path.join(__dirname,'../SSL/ca_bundle.crt'), 'utf8');

// var credentials = {
//     key: privateKey,
//     cert: certificate
//     // ca: chain
// };

// var server = https.createServer(credentials, app);

/**
 *	Server bootup section
 **/
try {
    // DB Connect
    mongoose.set('useCreateIndex', true);
    mongoose.connect(
        `${config.dbConnectionUrl}`,
        {
            useNewUrlParser: true,
            useFindAndModify: false,
            useUnifiedTopology: true
        },
        d => {
            if (d) return console.log(`ERROR CONNECTING TO DB ${config.dbConnectionUrl}`, d);
            console.log(`Connected to ${process.env.NODE_ENV} database: `, `${config.dbConnectionUrl}`);
            server.listen(config.port, function () {
                console.log('Admin Server listening at PORT:' + config.port);
            });
        }
    );
} catch (err) {
    console.log('DBCONNECT ERROR', err);
}

module.exports = app;
