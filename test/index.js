'use strict';

require('co-mocha');

let mongoose = require('mongoose'),
    Random = require('random-js')(),
    expect = require('chai').expect,
    Factory = require('../');

mongoose.connect('mongodb://localhost/test-mongoose-factory');

var db = mongoose.connection;
var User = mongoose.model('User', mongoose.Schema({
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
}));

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

function expectUser(attributes) {
    expect(attributes.name).to.match(/[0-9a-f]{32}/);
    expect(attributes.body).to.match(/[0-9a-f]{40}/);
    expect(attributes.comments.length).to.equal(3);
    expect(typeof attributes.date).to.equal('object');
    expect(attributes.hidden).to.eql(false);
    expect(attributes.meta.votes).to.match(/[0-9]{1,}/);
    expect(attributes.meta.favs).to.match(/[0-9]{1,}/);
}


describe('.attributes', function(){
    it('set user attributes', function * (){
        let attributes = Factory.attributes('user');
        expectUser(attributes);
    });

    it('set abstract attributes', function * (){
        Factory.define('abstract', function(lib) {
            this.votes = Random.integer(0, 30);
        });
        let attributes = Factory.attributes('abstract');
        expect(attributes.votes).to.match(/[0-9]{1,}/);
    });
    it('set empty attributes', function * (){
        Factory.define('empty', User, function(lib) { });
        let attributes = Factory.attributes('empty');
        expect(attributes).to.eql({});
    });
});

describe('.attributesArray', function(){
    it('set user attributes', function * (){
        let attributes = Factory.attributesArray('user', 2);
        expect(attributes.length).to.eql(2);
        attributes = attributes[0];
        expectUser(attributes);
    });

    it('set abstract attributes', function * (){
        Factory.define('abstract', function(lib) {
            this.votes = Random.integer(0, 30);
        });
        let attributes = Factory.attributesArray('abstract', 1);
        expect(attributes[0].votes).to.match(/[0-9]{1,}/);
    });
    it('set empty attributes', function * (){
        Factory.define('empty', User, function(lib) { });
        let attributes = Factory.attributesArray('empty', 2);
        expect(attributes.length).to.eql(2);
        expect(attributes[0]).to.eql({});
    });
});


describe('.build', function(){
    it('user entry', function * (){
        let user = Factory.build('user');
        expect(typeof user.toJSON()).to.eql('object');
        expectUser(user);
    });
});


