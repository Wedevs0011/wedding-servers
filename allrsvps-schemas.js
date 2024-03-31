const mongoose = require('mongoose');
// i can choose to place from this line to line 32 in ht enode js server file 
const rsvpSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
    },

    uuid: {
        type: String,
        required: true,
    },
});

module.exports = rsvpSchema;

