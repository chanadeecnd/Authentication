require('dotenv').config()
const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/userDB?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.0.1',
    { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
    email: {
        type:String,
    },
    password: {
        type: String,
    }
})

const secret = process.env.SECRET
// console.log(process.env.SECRET)


const User = mongoose.model('User',userSchema)

module.exports = User