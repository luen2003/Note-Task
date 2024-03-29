const mongoose = require('mongoose')

const TaskSchema = new mongoose.Schema({

  name: {
    type: String,
    required: [true, 'must provide name'],
    trim: true,
    maxlength: [100, 'name can not be more than 100 characters'],
  },
  username: {
    type: String,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },

},
{ timestamps: true }
)

module.exports = mongoose.model('Task', TaskSchema)