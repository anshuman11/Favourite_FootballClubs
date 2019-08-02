var express = require('express');
var app = express();
var path = require('path');
var session = require('express-session');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');



var uri = 'mongodb://localhost:27017/admin';

mongoose.Promise = global.Promise;

mongoose.connect(uri, { useNewUrlParser: true });
var db = mongoose.connection;

db.on('error', function (err) {
    throw err;
});

db.once('open', function () {
    console.log('Connected to database!');
})

var userSchema = new mongoose.Schema({
    username: String,
    password: String,
    data: Array
})

app.use(session({secret: 'assddaaddadd',saveUninitialized: true, resave: false}));
var userModel =  mongoose.model('user', userSchema);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/',function(req,res){
    res.render('login');
})

app.post('/signup',function(req,res){
    var user = new userModel({
        username: req.body.username,
        password: req.body.password
    });
    user.save(function(err){
        if(err)
            throw err;
        console.log('User Saved!');
    });
    res.render('login');
})

app.post('/login',function(req,res){
    console.log(req.body.username)
    userModel.find({username: req.body.username},function(err,doc){
        console.log(doc)
        if(err)
            throw err;
        if(!doc){
            console.log('User not found!');
            res.render('login',{message: 'User not found!'});
        }
        else{
            console.log(req.body.password,doc[0].password)
            if(doc[0].password == req.body.password){
                req.session.username = req.body.username;
                res.redirect('/dashboard');
            }
            else{
                console.log('Password Wrong!')
                res.render('login',{message: 'Password not match!'});
            }
        }
    })
})

app.get('/dashboard',function(req,res){
    console.log(req.session.username);
    userModel.find({username: req.session.username },{data:1,_id:0},function(err,docs){
        if(err) throw err;
        //console.log(docs);
        var arr = [];
        res.render('index',{allClubs: docs});
    });
})

app.post('/addClub',function(req,res,next){
    var obj = {
        club: req.body.club,
        city: req.body.city,
        country: req.body.country,
        league: req.body.league,
        source: req.body.source
    }
    userModel.where({username: req.session.username}).updateOne({$push:{data: obj}}).exec();
    res.redirect('/dashboard');
})

app.listen(5000,function(err){
    console.log('Running on http://localhost:5000');
})