//jshint esversion:6
require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
// const User = require('./models/user')
const session = require('express-session')
const passport = require('passport')
const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')

const app = express();
const port = 3000;
// const secret = process.env.SECRET

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
/**
 * ใช้ Express.js และ Express-session middleware เพื่อเปิดใช้งานการจัดการเซสชันในแอปพลิเคชัน. สตริง "Our little secret." 
 * เป็นคีย์เราคอนซีครีตและเป็นค่าลับที่ใช้ในการเข้ารหัสข้อมูลเซสชัน การตั้งค่า "resave" เป็น "false" แสดงว่าเซสชันจะไม่ถูกบันทึกใหม่ทุกครั้งที่ร้องขอถูกดำเนินการ
 * และ "saveUninitialized" ก็ถูกตั้งค่าเป็น "false" เพื่อไม่บันทึกเซสชันที่ไม่มีการเปลี่ยนแปลง.
 */
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}))
//เปิดใช้งาน Passport.js ในแอปพลิเคชันเพื่อเตรียมการใช้งานระบบการรับรองตัวตน.
app.use(passport.initialize())
//ใช้ Passport.js เพื่อจัดการเซสชันของผู้ใช้ในแอปพลิเคชัน.
app.use(passport.session())

mongoose.connect('mongodb://127.0.0.1:27017/userDB?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.0.1',
    { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
    email: {
        type: String,
    },
    password: {
        type: String,
    },
    googleId: String,
    secret: String
})
/*ใช้เชื่อม PassportLocalMongoose กับ Schema ของผู้ใช้ 
เพื่อช่วยในการจัดการการรับรองตัวตนผ่านชื่อผู้ใช้และรหัสผ่าน.*/
userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const User = mongoose.model('User', userSchema)
/*ใช้ createStrategy() จาก PassportLocalMongoose เพื่อกำหนดวิธีการรับรองตัวตนและการตรวจสอบรหัสผ่าน.*/
passport.use(User.createStrategy())
//ตั้งค่าการสร้างฟังก์ชันเพื่อบันทึกข้อมูลผู้ใช้ในเซสชัน.
passport.serializeUser(function (user, done) {
    done(null, user.id);
});
// ตั้งค่าการสร้างฟังก์ชันเพื่อดึงข้อมูลผู้ใช้จากเซสชัน.
passport.deserializeUser(function (id, done) {
    User.findById(id)
        .then(user => {
            done(null, user)
        })
        .catch(err => {
            done(err, null)
        })
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile)
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/logout', (req, res) => {
    req.logout(function (err) {
        if (err) { return next(err) }
        res.redirect('/')
    })

})

app.get('/secrets', (req, res) => {
    User.find({'secret':{$ne:null}})
        .then(foundUser=>{
            if(foundUser) res.render('secrets',{userWithSecrets:foundUser})
        })
        .catch(err=>console.log(err))
})

// app.get('/auth/google',(req,res)=>{
//     passport.authenticate("google",{scope:["profile"]})
// }) 
//ไปที่หน้า login ของ google
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }));
//หลังจาก login สำเร็จ
app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect secrets.
        res.redirect('/secrets');
    });

app.get('/submit', (req, res) => {
    if (req.isAuthenticated()) res.render('submit')
    else res.redirect('/login')
})

app.post('/register', (req, res) => {
    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err)
            res.redirect('register')
        } else {
            passport.authenticate('local')(req, res, function () {
                res.redirect('/secrets')
            })
        }
    })
});

app.post('/login', (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })
    req.login(user, function (err) {
        if (err) {
            console.log(err)
        } else {
            passport.authenticate('local')(req, res, function () {
                res.redirect('/secrets')
            })
        }
    })
});

app.post('/submit', (req, res) => {
    const submittedSecret = req.body.secret
    console.log(req.user.id)
    User.findById(req.user.id)
        .then(foundUser => {
            if (foundUser) {
                foundUser.secret = submittedSecret
                foundUser.save()
                    .then(() => res.redirect('/secrets'))
            }
        })
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);

});