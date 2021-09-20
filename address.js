const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AddressSchema = new Schema({
    user_id: {
        type: Number,
        required: true
    },
    address: {
        type: String,
        
    }
})

module.exports = Address = mongoose.model("Address", AddressSchema)