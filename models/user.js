const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/userDB?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.0.1',
    { useNewUrlParser: true });
const userSchema = mongoose.Schema({
    email: {
        type:String,
    },
    password: {
        type: String,
    }
})

const User = mongoose.model('User',userSchema)

module.exports = User