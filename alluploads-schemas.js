const mongoose = require('mongoose');
// i can choose to place from this line to line 32 in ht enode js server file 
const uploadSchema = new mongoose.Schema({

    imageUrls: {
        type: [String],
        required: true,
    },
});

module.exports = uploadSchema;

