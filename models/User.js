const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
  
  username: {
    type: String,
    required: [true, 'must provide name'],
    trim: true,
    maxlength: [100, 'name can not be more than 100 characters'],
  },
  password: {
    type: String,
    required: [true, 'must provide password'],
  },

})

module.exports = mongoose.model('User', UserSchema)