const LocalStrategy = require('passport-local').Strategy;
const passport = require('passport');
const bcrypt = require('bcrypt');
const User = require('../models/users');
var ObjectId = require('mongodb').ObjectId;

passport.serializeUser(function(user, done) {
    done(null, user._id);
});

passport.deserializeUser(function(_id, done) {
    User.findOne({"_id": new ObjectId(_id)})
        .then((user) => done(null, user))
        .catch((err) => console.log(err));
});

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
    },
    function (email, password, done) {
        User.findOne({
            email
        }).then((user) => {
            if (!user){
                return done(null, false, { message: 'Incorrect username' });
            }
            // if (user.password === password){
            //     return done(null, user);
            // }else{
            //     return done(null, false, { message: 'Incorrect username and password' });
            // }
            bcrypt.compare(password, user.password, function (err,result) {
                if (err) { return done(err); }
                if(!result) {
                    return done(null, false, { message: 'Incorrect username and password' });
                }
                return done(null, user);
            })
        }).catch(function (err) {
            return done(err);
        })

        // db.user.find({where : {
        //     username : username
        // }}).then(function (user) {
        //     bcrypt.compare(password, user.password, function (err,result) {
        //         if (err) { return done(err); }
        //         if(!result) {
        //             return done(null, false, { message: 'Incorrect username and password' });
        //         }
        //         return done(null, user);
        //     })
        // }).catch(function (err) {
        //     return done(err);
        // })
    }
));

module.exports = passport;