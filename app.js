//jshint esversion:6
const express = require('express');
const bodyParser = require('body-parser');
const User = require('./models/user')

const app = express();
const port = 3000;

app.set('view engine','ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended:true}));

app.get('/',(req,res)=>{
    res.render('home');
});

app.get('/login',(req,res)=>{
    res.render('login');
});

app.get('/register',(req,res)=>{
    res.render('register');
});

app.post('/register',(req,res)=>{
    const newUser = new User({
        email:req.body.username,
        password:req.body.password
    });
    newUser.save()
    .then(()=>res.render('secrets'))
    .catch(err=>console.log(err))
});

app.post('/login',(req,res)=>{
    const userName = req.body.username;
    User.findOne({email:userName})
    .then(user =>{
        if(user.password === req.body.password){
            res.render('secrets')
        }else{
            res.redirect('login')
        }
    })
    .catch(()=>res.redirect('login'))
});

app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
});