'use strict';

require('co-mocha');

let mongoose = require('mongoose'),
    Random = require('random-js')(),
    Factory = require('../');

mongoose.connect('mongodb://localhost/test-mongo-factory');

var db = mongoose.connection;
var userSchema = mongoose.Schema({
    name:  String,
    body:   String,
    comments: [{ 
        body: String, 
        date: Date 
    }],
    date: { type: Date, default: Date.now },
    hidden: Boolean,
    meta: {
        votes: Number,
        favs:  Number
    }
});
var User = mongoose.model('User', userSchema);

Factory.define('user.meta', function(lib) {
    this.votes = Random.integer(0, 30);
    this.favs = Random.integer(0, 10);
});

Factory.define('user.comment', function(lib) {
    this.body = Random.hex(32);
    this.date = new Date();
});

Factory.define('user', User, function(lib) {
    this.name = Random.hex(32);
    this.body = Random.hex(40);
    this.comments = lib.attributesArray('user.comment', 3);
    this.date = new Date();
    this.hidden = false;
    this.meta = lib.attributes('user.meta');
});

it('works', function * (){
    let user = yield Factory.create('user');
    console.log(user);
});

