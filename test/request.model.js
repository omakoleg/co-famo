'use strict';

let mongoose = require('mongoose');

let schema = mongoose.Schema({
    body:  String,
    text: String
});

module.exports = mongoose.model('Request', schema);
