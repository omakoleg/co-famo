'use strict';

require('co-mocha');

let mongoose = require('mongoose'),
    Random = require('random-js')(),
    expect = require('chai').expect,
    Factory = require('../');

mongoose.connect('mongodb://localhost/test-mongoose-factory');
// mongoose.set('debug', true);

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
function expectUserEqual(user, expected) {
    expect(user.name).to.eql(expected.name);
    expect(user.body).to.eql(expected.body);
    expect(user.comments.length).to.equal(expected.comments.length);
    expect(user.hidden).to.eql(expected.hidden);
    expect(user.meta.favs).to.eql(expected.meta.favs);
    expect(user.meta.votes).to.eql(expected.meta.votes);
}

function findUser(query){
    query = query || {};
    return new Promise(function(resolve, reject){
        User.findOne(query, function (err, user) {
            if(err) {
                return reject(err);
            }
            resolve(user);
        });
    });
}

describe('.define', function(){ 
    it('redefine error', function * (){
        expect(function(){
            Factory.define('redefine.me', function(){} );
            Factory.define('redefine.me', function(){} ); //throw
        }).to.throw('Mongo factory redefine.me already defined');
    });

    it('without builder funciton', function * (){
        expect(function(){
            Factory.define('no.builder');
        }).to.throw('Mongo factory no.builder definition don\'t have builder function');
    });

    it('without model', function * (){
        Factory.define('no.model', function(lib) {
            this.id = 1;
        });
        // internals
        expect(Factory.registry['no.model'].model).to.eql(null);
    });
});

describe('.clean', function(){
    it('all entries', function * (){
        yield Factory.clean('user'); // clean all
        yield Factory.create('user');
        yield Factory.create('user');
        let cnt = yield User.count().exec(); // 2
        expect(cnt).to.eql(2);
        yield Factory.clean('user'); // clean
        let cntClean = yield User.count().exec();
        expect(cntClean).to.eql(0); // 0
    });

    it('by query', function * (){
        yield Factory.clean('user'); // clean all
        yield Factory.create('user', {name: 'test'});
        yield Factory.create('user');
        let cnt = yield User.count().exec();
        expect(cnt).to.eql(2);
        yield Factory.clean('user', {name: 'test'});
        let cntClean = yield User.count().exec();
        expect(cntClean).to.eql(1);
    });
});

describe('.attributes', function(){
    it('set user attributes', function * (){
        let attributes = Factory.attributes('user');
        expectUser(attributes);
    });

    it('set abstract attributes', function * (){
        Factory.define('abstract.attributes', function() {
            this.votes = Random.integer(0, 30);
        });
        let attributes = Factory.attributes('abstract.attributes');
        expect(attributes.votes).to.match(/[0-9]{1,}/);
    });
    it('set empty attributes', function * (){
        Factory.define('empty.attributes', User, function() { });
        let attributes = Factory.attributes('empty.attributes');
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
        Factory.define('abstract.attributesArray', function() {
            this.votes = Random.integer(0, 30);
        });
        let attributes = Factory.attributesArray('abstract.attributesArray', 1);
        expect(attributes[0].votes).to.match(/[0-9]{1,}/);
    });
    it('set empty attributes', function * (){
        Factory.define('empty.attributesArray', User, function() { });
        let attributes = Factory.attributesArray('empty.attributesArray', 2);
        expect(attributes.length).to.eql(2);
        expect(attributes[0]).to.eql({});
    });

    it('default count is 1', function * (){
        let users = yield Factory.attributesArray('user');
        expect(users.length).to.eql(1);
    });
});


describe('.build', function(){
    it('user entry', function * (){
        let user = Factory.build('user');
        expect(typeof user.toJSON()).to.eql('object');
        expectUser(user);
    });

    it('user internal entries are build', function * (){
        let user = Factory.build('user');
        expectUser(user);
        expect(user.meta).to.not.eql(null);
        expect(user.meta.votes).to.match(/[0-9]{1,}/);
        expect(user.meta.favs).to.match(/[0-9]{1,}/);
    });

    it('user.meta entry throw an error', function * (){
        expect(function(){
            Factory.build('user.meta');
        }).to.throw('Mongo factory user.meta is absctract. No mongoose model attached to it');
    });
});

describe('.buildArray', function(){
    it('user entry', function * (){
        yield Factory.clean('user'); // clean all
        let users = yield Factory.buildArray('user'); // build 1
        expectUser(users[0]);
        let cntMongo = yield User.count();
        expect(cntMongo).to.eql(0);
    });

    it('user.meta entry', function * (){
        expect(function(){
            Factory.buildArray('user.meta'); //will throw same as build
        }).to.throw('Mongo factory user.meta is absctract. No mongoose model attached to it');
    });

    it('default count is 1', function * (){
        let users = yield Factory.buildArray('user');
        expect(users.length).to.eql(1);
    });
});

describe('.create', function(){
    it('user entry', function * (){
        let user = yield Factory.create('user');
        expect(user._id).to.match(/[0-9a-f]{10,}/);
        expect(typeof user.toJSON()).to.eql('object');
        expectUser(user);
        let userMongo = yield User.findById(user._id).exec();
        expectUserEqual(user, userMongo.toObject());
    });

    it('user.meta entry', function * (){
        expect(function(){
            Factory.create('user.meta'); //will throw same as build
        }).to.throw('Mongo factory user.meta is absctract. No mongoose model attached to it');
    });
});

describe('.createArray', function(){
    it('user entry', function * (){
        yield Factory.clean('user'); // clean all
        let users = yield Factory.createArray('user', 2);
        expect(users.length).to.eql(2);
        expect(users[0]._id).to.match(/[0-9a-f]{10,}/);
        expect(users[1]._id).to.match(/[0-9a-f]{10,}/);
        expectUser(users[0]);
        expectUser(users[1]);
    });

    it('user.meta entry', function * (){
        expect(function(){
            Factory.createArray('user.meta', 2); //will throw same as build
        }).to.throw('Mongo factory user.meta is absctract. No mongoose model attached to it');
    });

    it('default count is 1', function * (){
        let users = yield Factory.createArray('user');
        expect(users.length).to.eql(1);
    });
});






