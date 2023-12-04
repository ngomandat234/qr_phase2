require('dotenv').config()
const express = require('express');
const app = express();
const ejs = require('ejs');
const path = require('path');
const db = require('./config/database');
// const route = require('./routes');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const session = require('express-session');
var passport = require('./config/passport');
const checkAuthenticate = require('./middleware/auth');
const saltRounds = 10;
const bcrypt = require("bcrypt");
const {generateTracking} = require('./lib/qrcode');
const moment = require("moment");

app.use('/', express.static(path.join(__dirname, 'public')))

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'));

app.use(cors());

app.use(cookieParser());

app.use(session({
    secret : "fms-secret",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.authenticate('session'));
app.use(passport.initialize());
app.use(passport.session());

db.connect();

// route(app);

const QrTracking = require('./models/qr_tracking')
const mongoose = require('mongoose')
app.get('/tracking/:userId', (req, res) => {
    const { userId } = req.params
    const time_now = moment()
    const tracking = new QrTracking({
        user: userId
    })

    try{
        tracking.save()
        res.status(200).json({
            status: 200,
            data: tracking
        })
    }catch(e){
        res.send("404")
    }
})

const route = require('./routes')
route(app)

const port = process.env.PORT || 3000;
app.listen(port, () =>{
    console.log(`App run port: ${port}`);
})