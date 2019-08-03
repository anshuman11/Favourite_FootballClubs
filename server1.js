var express = require('express');
var app = express();
var path = require('path');
var session = require('express-session');
var bodyParser = require('body-parser');
const passport = require('passport');
const passportLocal = require('passport-local').Strategy;
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const saltrounds = 10;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(session({secret: "I love salsa",  saveUninitialized: true, resave: false}));
app.use(passport.initialize());
app.use(passport.session());

app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

//database seup
var mongoose = require('mongoose');
var uri = 'mongodb+srv://dev_chauhan_10:dschauhan_11m@cluster0-be1gc.mongodb.net/test?retryWrites=true&w=majority';
mongoose.Promise = global.Promise;
//connect to mongodb through mongoose
mongoose.connect(uri, { useNewUrlParser: true });
var db = mongoose.connection;

db.on('error', function (err) {
    throw err;
});

db.once('open', function () {
    console.log('Connected to database!');
})

//define schema logic

var userSchema = new mongoose.Schema({
    username: String,
    password: String,
    data: Array
})

//create model of schema

var userModel =  mongoose.model('user', userSchema);


// REST api's

app.get('/',function(req,res){
    res.render('login');
})

app.get('/signup',function(req,res){
    res.render('signup');
})


app.post('/signup',function(req,res){

    let name = req.body.username;
    let password = req.body.password;
    bcrypt.hash(password, saltrounds, function(err, hash){
        if(err) throw err;
        var user = new userModel({
            username: req.body.username,
            password: hash
        });
        user.save(function(err){
            if(err)
                throw err;
            //console.log('User Saved!');
        });
        res.render('login');
    })  
})

app.post('/login', passport.authenticate('local', 
    {
        successRedirect: '/dashboard',
        failureRedirect: '/'
    }
))

// local strategy

passport.use(new passportLocal(
    function(username, password, done){
//extract password from db
userModel.find({username: username},function(err,doc){
    //console.log(doc)
    if(err)
        throw err;
    if(!doc){
        //console.log('User not found!');
        res.render('login',{message: 'User not found!'});
    }
    else{
        pass = doc[0].password;
        bcrypt.compare(password, pass, function(err, res) {
            if(res)  return done(null, username)
            else  return done(null, false, {message: 'Password is incorrect'})
        });   
        }
    })
}))


//serialize logic

passport.serializeUser(function(user, done){
    done(null, user)
})
passport.deserializeUser(function(user, done){
    done(null, user)
})



app.get('/dashboard',function(req,res){
    //console.log(req.user);
    if(req.user){
        userModel.find({username: req.user },{data:1,_id:0},function(err,docs){
            if(err) throw err;
            //console.log(docs);
            res.render('index',{allClubs: docs});
        });
    }
    else{
        res.render("login");
    }
})

app.post('/addClub',function(req,res,next){
    var obj = {
        club: req.body.club,
        city: req.body.city,
        country: req.body.country,
        league: req.body.league,
        source: req.body.source,
        number: parseInt(Math.random()*1000000000)
    }
    userModel.where({username: req.user}).updateOne({$push:{data: obj}}).exec();
    res.redirect('/dashboard');
})

app.post('/deleteClub',function(req,res){
    var num = parseInt(req.body.number);
    userModel.where({username: req.user}).updateOne({$pull:{data: {number: num}}}).exec();
    res.sendStatus(200);
})

app.set('port', process.env.PORT || 5000);

app.listen(app.get('port'), function (err) {
    if (err)
        console.log(err);
    console.log('Running on http://localhost:%s', app.get('port'));
})