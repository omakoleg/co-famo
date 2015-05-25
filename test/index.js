'use strict';

require('co-mocha');
let mongoose = require('mongoose'),
    Factory = require('../');

mongoose.connect('mongodb://localhost/test-mongo-factory');
var db = mongoose.connection;
// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', function (callback) {
  
// });
// 
var userSchema = mongoose.Schema({
    name:  String,
    body:   String,
    comments: [{ body: String, date: Date }],
    date: { type: Date, default: Date.now },
    hidden: Boolean,
    meta: {
        votes: Number,
        favs:  Number
    }
});
var User = mongoose.model('User', userSchema);

Factory.define('user.meta', function(lib) {
    this.votes = lib.rndNumber();
    this.favs = lib.rndNumber(0, 10);
});

Factory.define('user.comment', function(lib) {
    this.votes = lib.rndNumber();
    this.favs = lib.rndNumber(0, 10);
});

Factory.define('user', User, function(lib) {
    this.name = lib.rndHex(32);
    this.body = lib.rndHex(40);
    this.comments = lib.buildArray('user.comment', 0, 10);
    this.date = new Date();
    this.hidden = false;
    this.meta = lib.attributes('user.meta');
});

it('works', function * (){
    let user = yield Factory.create('user');
    console.log(user);
});

