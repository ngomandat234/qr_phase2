const QrTracking = require('../models/qr_tracking')
const User = require('../models/users')
const QrPrinter = require('../models/qr_printer')
const Attachment = require('../models/attachment')
const moment = require('moment-timezone')

var passport = require('../config/passport')
const saltRounds = 10
const bcrypt = require("bcrypt")
const {generateTracking} = require('../lib/qrcode')
const checkAuthenticate = require('../middleware/auth')
const upload = require('../config/multer')
const fs = require('fs')
const {genPrinting} = require("../config/excel")
const asyncFunction = async (item, index, user_name) => {
    // Simulate an asynchronous operation
    return new Promise(resolve => {
        resolve({
            index: index + 1,
            name: user_name,
            time: moment(item.createdAt).tz('Asia/Ho_Chi_Minh').format("HH:mm DD/MM/YYYY")
        });
    });
  };
module.exports = function route(app){
    app.get('/', checkAuthenticate ,(req, res) => {
        res.render('pages/home');
    })
    
    app.get('/login', (req, res) =>{
        res.render('pages/auth/login')
    })
    
    app.post('/login', passport.authenticate('local', { successReturnToOrRedirect: '/my-profile', failureRedirect: '/login' }));
    
    app.get('/register', (req, res) => {
        res.render('pages/auth/register', {errors: []})
    })

    app.post('/register', async (req, res) => {    
        if (
            req.body.email === "" ||
            req.body.name === "" ||
            req.body.password  === "" ||
            req.body.password_confirmation === ""
        ){
            res.render('pages/auth/register', {errors: [{message: 'All fields are required.'}]});
            return
        }
    
        existUser = await User.findOne({email: req.body.email});
        if (existUser){
            res.render('pages/auth/register', {errors: [{message: 'Email is exist.'}]});
            return
        }
        if (req.body.password !== req.body.password_confirmation){
            res.render('pages/auth/register', {errors: [{message: 'Password is not matched.'}]});
            return
        }
    
        try{
            const user = new User(req.body);
            user.password = await bcrypt.hash(user.password, saltRounds)
            user.qrCode = await generateTracking(user._id)
            await user.save();
            res.redirect('/login')
        }catch(err){
            console.log(err);
            res.render('pages/auth/register', {errors: [{message: 'Server error.'}]});
        }
    
    })
    
    app.get('/my-profile', checkAuthenticate, (req, res) =>{
        res.render('pages/auth/my-profile', {current_user: req.user, errors: [], notices: []});
    })

    app.post('/my-profile/change_password', checkAuthenticate, async (req, res) =>{
        const {
            password_old, 
            password, 
            password_confirmation
        } = req.body;

        const is_matched_password_old = await bcrypt.compare(password_old, req.user.password);
        if (!is_matched_password_old){
            res.render('pages/auth/my-profile', {current_user: req.user, errors: [{message: 'Password old is incorrect.'}], notices: []});
            return
        }

        if (
            password  === "" ||
            password_confirmation === ""
        ){
            res.render('pages/auth/my-profile', {current_user: req.user, errors: [{message: 'All fields are required.'}], notices: []});
            return
        }

        if (password !== password_confirmation){
            res.render('pages/auth/my-profile', {current_user: req.user, errors: [{message: 'Password is not matched.'}], notices: []});
            return
        }

        req.user.password = await bcrypt.hash(password, saltRounds);
        await req.user.save();
        res.render('pages/auth/my-profile', {current_user: req.user, errors: [], notices: [{message: 'Updated password successfully.'}]});
    })

    app.post('/my-profile', checkAuthenticate, async(req, res) =>{
        req.user.name = req.body.name;

        await req.user.save();
        res.redirect('/my-profile');
    })

    app.get('/logout', (req, res) =>{
        req.logout((err) =>{
            if (err) { return next(err); }
            res.redirect('/');
        });
    })


    app.get('/api/users/:id', async(req,res) => {
        const _id = req.params.id;
        if (!_id){
            res.status(400).json({
                status: 400,
                data: null,
                message: '1'
            })
            return
        }

        const user = await User.findOne({_id})
        if (!user){
            res.status(400).json({
                status: 400,
                data: null,
                message: '2'
            })
            return
        }

        const qr_printer = new QrPrinter({
            user: user._id
        })
        
        try{
            await qr_printer.save()
        }catch (error){
            res.status(400).json({
                status: 400,
                data: null,
                message: 'create qr_printer fail'
            })
            return
        }

        res.status(200).json({
            status: 200,
            data: {
                qrCode: user.qrCode
            }
        })
    })

    app.get('/api/users', async(req, res) => {
        const fetch = (users) =>{
            return users.map(item => {
                return {_id: item._id}
            })
        }
        const users = await User.find()
        const datas = fetch(users);
        if (!users){
            res.status(400).json({
                status: 400,
                data: null,
                message: 'no data'
            })
            return
        }
    
        res.status(200).json({
            status: 200,
            datas: datas
        })
    })

    app.get('/users/search', async(req, res) => {
        const avatar_name = req.query.avatar_name;
        if (!avatar_name){
            res.status(400).json({
                status: 400,
                data: null,
                message: '1'
            })
            return
        }

        const user = await User.findOne({avatar: avatar_name})
        if (!user){
            res.status(400).json({
                status: 400,
                data: null,
                message: '2'
            })
            return
        }

        res.status(200).json({
            status: 200,
            data: {
                _id: user._id, 
                name: user.name,
                email: user.email, 
                avatar: user.avatar, 
                qrCode: user.qrCode
            }
        })
    })

    app.get('/users', checkAuthenticate, async (req, res) =>{
        const users = await User.find({status: { $gte: 1 }})
        res.render('pages/users/index', {users: users, current_user: req.user})
    })
    
    app.get('/users/:_id/set_role', checkAuthenticate, async(req, res) =>{
        const { _id } = req.params
        const {status} = req.query
        const user = await User.findOne({_id})

        if (status == "1"){
            user.group_user = 'admin'
        } else{
            user.group_user = 'user'
        }

        await user.save()
        res.redirect('/users')
    })
    
    app.get('/users/:_id/delete', checkAuthenticate, async(req, res) => {
        const { _id } = req.params 
        const user = await User.findOne({_id})
        
        user.status = 0;
        await user.save();
       res.redirect('/users');
    })

    app.get('/users/:_id/export_printing', async(req, res) =>{
        const { _id } = req.params 
        const user = await User.findOne({_id})
        const printings = await QrPrinter.find({user: _id}).sort({createdAt: -1})
        
        const datas = await Promise.all(printings.map(async (item,index) => await asyncFunction(item, index, user.name)));

        const fileName = await genPrinting({file_name: `Lịch sử in ${user.name}`, datas});
        res.sendFile(fileName);
    });

    app.get('/users/:_id/export_tracking', async(req, res) =>{
        const { _id } = req.params 
        const user = await User.findOne({_id})
        const trackings = await QrTracking.find({user: _id}).sort({createdAt: -1})
        
        const datas = await Promise.all(trackings.map(async (item,index) => await asyncFunction(item, index, user.name)));

        const fileName = await genPrinting({file_name: `Lịch sử quét ${user.name}`, datas});
        res.sendFile(fileName);
    });

    app.get('/users/:_id', checkAuthenticate, async(req, res) => {
        const { _id } = req.params 
        const user = await User.findOne({_id}).populate('trackings')
        const trackings = await QrTracking.find({user: _id}).sort({createdAt: -1})
        const printings = await QrPrinter.find({user: _id}).sort({createdAt: -1})
        res.render('pages/users/show', {
            user,
            trackings,
            printings,
            moment,
            current_user: req.user
        })
    })

    app.post('/my-profile/change_avatar', checkAuthenticate, upload.single('img'), async(req,res) =>{
        if (!req.file){
            res.status(400).json({
                status: 400,
                file: null,
                message: 'Null file'
            })
            return
        }
        const attachment = new Attachment({
            ...req.file,
            filename: req.file.filename.split('.')[0]
        });
        await attachment.save()

        req.user.avatar = attachment.filename
        req.user.save()

        res.redirect('/my-profile')
    })


    app.post('/uploader', upload.single('img') ,async (req, res) =>{
        if (!req.file){
            res.status(400).json({
                status: 400,
                file: null,
                message: 'Null file'
            })
            return
        }
        const attachment = new Attachment({
            ...req.file,
            filename: req.file.filename.split('.')[0]
        });
        await attachment.save()
        res.json(attachment);
    })

    app.get('/uploader/:filename', async (req,res) =>{
        const filename = req.params.filename

        const attachment = await Attachment.findOne({filename})

        if (!attachment){
            res.status(400).json({
                status: 400,
                data: null
            })
            return
        }
        console.log(process.cwd() + '/' + attachment.path);
        res.sendFile( process.cwd() + '/' + attachment.path);
    })
}