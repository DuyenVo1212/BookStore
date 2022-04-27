const mongoose = require('mongoose');
const categorySchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    books:[{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book",
    }],
    createdAt:{
        type: Date,
        required: true,
        default: Date.now()
    }
});

module.exports = mongoose.model("Category", categorySchema);