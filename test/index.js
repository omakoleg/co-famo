'use strict';

let mongoose = require('mongoose'),
    Random = require('random-js')(),
    assert = require('assert'),
    mockgoose = require('mockgoose'),
    User = require('./user.model'),
    RequestModel = require('./request.model'),
    cofamo = require('../');

require('co-mocha');
mockgoose(mongoose);
let Factory = new cofamo.Factory();

before(function(done) {
    mongoose.connect('mongodb://example.com/TestingDB', function() {
        done();
    });
});
// mongoose.set('debug', true);

Factory.define('with.trait', RequestModel, function() {
    this.body = Random.hex(32);
    this.text = Random.hex(32);

    this.noText = function(){
        delete this.text;
    };
    this.replaceText = function(value){
        this.text = value;
    };
});

Factory.define('user.meta', function() {
    this.votes = Random.integer(1, 30);
    this.favs = Random.integer(1, 10);
});

Factory.define('user.comment', function() {
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
    // name
    assert.equal(attributes.name.length, 32);
    assert.equal(typeof attributes.name, 'string');
    // body
    assert.equal(attributes.body.length, 40);
    assert.equal(typeof attributes.body, 'string');
    // comments
    assert.strictEqual(attributes.comments.length, 3);
    // date
    assert.equal(typeof attributes.date, 'object');
    // hidden
    assert.strictEqual(attributes.hidden, false);
    // votes
    assert(attributes.meta.votes > 0);
    assert.equal(typeof attributes.meta.votes, 'number');
    // favs
    assert(attributes.meta.favs > 0);
    assert.equal(typeof attributes.meta.favs, 'number');
}
function expectUserEqual(user, expected) {
    assert.equal(user.name, expected.name);
    assert.equal(user.body, expected.body);
    assert.equal(user.comments.length, expected.comments.length);
    assert.equal(user.hidden, expected.hidden);
    assert.equal(user.meta.favs, expected.meta.favs);
    assert.equal(user.meta.votes, expected.meta.votes);
}

describe('custom provider', function(){
    it('no provider set allow to use attributes', function*() {
        let f = new cofamo.Factory({
            provider: null
        });
        f.define('test', function(){
            this.a = 1;
        })
        assert.deepEqual(f.attributes('test'), { a: 1 });
    });

    it('full cycle for memory provider', function*() {
        let f = new cofamo.Factory({
            provider: new cofamo.MemoryProvider()
        });
        class MemoryModel {
            constructor(attr) {
                this.a = attr.a;
            }
        }
        f.define('test', MemoryModel, function(){
            this.a = 1;
        })
        assert.deepEqual(f.attributes('test'), { a: 1 });
        assert.deepEqual(f.build('test'), { a: 1 });
        assert.deepEqual(f.object('test'), { a: 1 });
        assert.deepEqual(yield f.create('test'), { a: 1, _id: 1 });
    });
});

describe('constructor', function() {
    
    it('set options', function *() {
        let Factory2 = new cofamo.Factory({
            errorPrefix: '1',
            provider: '2'
        });
        assert.equal(Factory2.errorPrefix, '1');
        assert.equal(Factory2.provider, '2');
    });
    it('call resetRegistry');
    it('call resetGlobalTraits');
});

describe('resetGlobalTraits', function() {
    
    it('reset', function * () {
        let f = new cofamo.Factory();
        f.traits.my = function() {}
        f.resetGlobalTraits();
        assert.deepEqual(Object.keys(f.traits), ['omit']);
    });
});

describe('resetRegistry', function() {
    
    it('reset', function * () {
        let f = new cofamo.Factory();
        f.define('test', function(){ });
        f.resetRegistry();
        assert.deepEqual(f.registry, {});
    });
});

describe('merging data', function (){
    it('do deep merge object', function * (){
        Factory.define('user-345234523', function() {
            this.first = {
                second: {
                    third: 1
                }
            };
        });
        let mergedData = Factory.attributes('user-345234523', {
            first: {
                second: {
                    fourth: 2
                }
            }
        });
        assert.deepEqual(mergedData, {
            first: {
                second: {
                    third: 1,
                    fourth: 2
                }
            }
        });
    });

    it('do not deep merge array', function * (){
        Factory.define('user-624dfg34', function() {
            this.first = [ 1 ];
        });
        let mergedData = Factory.attributes('user-624dfg34', {
            first: [ 2 ]
        });
        assert.deepEqual(mergedData, {
            first: [ 2 ]
        });
    });
});

describe('traits', function (){
    it('applied without value', function * (){
        let res = Factory.attributes('with.trait', {}, { noText: true });
        assert.strictEqual(res.text, undefined);
    });
    it('applied with value', function * (){
        let res = Factory.attributes('with.trait', {}, { replaceText: 'new-value' });
        assert.equal(res.text, 'new-value');
    });
});

describe('dynamic traits', function() {

    it('works', function * (){
        Factory.traits.custom = function(mixedValue, attributes) {
            attributes._id = 'some-id-' + mixedValue;
        };
        Factory.define('user-12332', function() {
            this.name = 'test user';
        });
        let userWithId = Factory.attributes('user-12332', {}, { custom: '10'});
        assert.equal(userWithId.name, 'test user');
        assert.equal(userWithId._id, 'some-id-10');
        delete Factory.traits.custom;
    });

    it('could be redefined', function * (){
        Factory.traits.custom = function(mixedValue, attributes) {
            attributes._id = 'some-id-' + mixedValue;
        };
        Factory.define('user233456', function() {
            this.name = 'test user';
        });
        let userWithId = Factory.attributes('user233456', {}, { custom: '10'});
        Factory.traits.custom = function(mixedValue, attributes) {
            attributes._id = 'some-other-id-' + mixedValue;
        };
        assert.equal(userWithId._id, 'some-id-10');

        let userWithOtherId = Factory.attributes('user233456', {}, { custom: '10'});
        assert.equal(userWithOtherId._id, 'some-other-id-10');

        delete Factory.traits.custom;
    });
});

describe('predefined traits ', function (){
    it('cant overwrite global trait funcitonality with locally defined', function*() {
        Factory.define('some_342535', function() {
            this.id = 234;
            this.cid = 567;
            this.omit = function() {
                this.id = 12345;
            };
        });
        let obj = Factory.object('some_342535', {}, { omit: 'cid'});
        assert.strictEqual(obj.cid, undefined);
        assert.equal(obj.id, 234);
        obj.omit();
        assert.equal(obj.id, 12345);
    });

    describe('omit ', function (){
        it('applied as array', function * (){
            let res = Factory.attributes('with.trait', {}, { omit: ['text', 'body'] });
            assert.strictEqual(res.text, undefined);
            assert.strictEqual(res.body, undefined);
        });

        it('applied as string', function * (){
            let res = Factory.attributes('with.trait', {}, { omit: 'text' });
            assert.strictEqual(res.text, undefined);
        });
    });
});

describe('.define', function(){ 
    describe('. With parent ', function() {

        it('multiple inheritance', function * (){
            assert.throws(function(){
                Factory.define('model.asd > bad > me', function(){ });
            }, 'Mongo factory model.asd > bad > me definition have multiple inheritance. Use only one parent.');
        });

        it('parent not defined', function * (){
            assert.throws(function(){
                Factory.define('model.asd > bad', function(){ });
            }, 'Mongo factory bad parent not defined');
        });

        it('child already defined', function * (){
            Factory.define('parent123', function(){ });
            Factory.define('child123', function(){ });
            assert.throws(function(){
                Factory.define('child123> parent123', function(){ });
            }, 'Mongo factory child123 already defined');
        });
    });

    it('redefine error', function * (){
        assert.throws(function(){
            Factory.define('redefine.me', function(){} );
            Factory.define('redefine.me', function(){} ); //throw
        }, 'Mongo factory redefine.me already defined');
    });

    it('without builder function', function * (){
        assert.throws(function(){
            Factory.define('no.builder');
        }, 'Mongo factory no.builder definition don\'t have builder function');
    });

    it('without model', function * (){
        Factory.define('no.model', function() {
            this.id = 1;
        });
        // internals
        assert.equal(Factory.registry['no.model'].model, null);
    });

    it('with aliases', function * (){
        Factory.define(['alias.model', 'alias.model.2'], function() { });
        // internals
        assert.notEqual(Factory.registry['alias.model'], null);
        assert.notEqual(Factory.registry['alias.model.2'], null);
    });

    it('with duplicate aliases', function * (){
        assert.throws(function(){
            Factory.define(['alias.123', 'alias.123'], function() { });
        }, 'Mongo factory alias.123 already defined');
    });

    it('with duplicate name', function * (){
        Factory.define('model.asd', function(){ });
        assert.throws(function(){
            Factory.define(['model.asd'], function() { });
        }, 'Mongo factory model.asd already defined');
    });

    it('without name', function * (){
        assert.throws(function(){
            Factory.define();
        }, 'Mongo factory Definition require factory name to be specified');
    });

    it('with array of non string', function * (){
        assert.throws(function(){
            Factory.define([1], function(){ });
        }, 'Mongo factory 1 definition name should be a string');
    });

    it('with non string name', function * (){
        assert.throws(function(){
            Factory.define(1, function(){ });
        }, 'Mongo factory 1 definition name should be a string');
    });
});

describe('.clean', function(){
    it('all entries', function * (){
        yield Factory.clean('user'); // clean all
        yield Factory.create('user');
        yield Factory.create('user');
        let cnt = yield User.count().exec(); // 2
        assert.equal(cnt, 2);
        yield Factory.clean('user'); // clean
        let cntClean = yield User.count().exec();
        assert.equal(cntClean, 0); // 0
    });

    it('by query', function * (){
        yield Factory.clean('user'); // clean all
        yield Factory.create('user', {name: 'test'});
        yield Factory.create('user');
        let cnt = yield User.count().exec();
        assert.equal(cnt, 2);
        yield Factory.clean('user', {name: 'test'});
        let cntClean = yield User.count().exec();
        assert.equal(cntClean, 1);
    });
});

describe('.object', function(){
    it('do not remove functions from object', function* (){
        Factory.define('user452345234', function() {
            this.name = 'my name';
            this.setId = function() {
                this.id213 = 123;
            };
        });
        let object = Factory.object('user452345234');
        assert.equal(object.name, 'my name');
        assert.equal(typeof object.setId, 'function');
        object.setId();
        assert.equal(object.id213, 123);
    });

    it('do not remove functions from parent object', function* (){
        Factory.define('parent_sdt4', function() {
            this.parentMethod = function() {
                this.id213 = 567;
            };
        });
        Factory.define('child_213 > parent_sdt4', function() {
            this.setId = function() {
                this.id213 = 123;
            };
        });
        let object = Factory.object('child_213');
        assert.equal(typeof object.setId, 'function');
        assert.equal(typeof object.parentMethod, 'function');
        object.parentMethod();
        assert.equal(object.id213, 567);
    });

    it('traits applied after merging parent.', function* (){
        Factory.define('parent_sdt45', function() {
            this.someMethod = function() {
                this.id213 = 567;
            };
        });
        Factory.define('child_2135 > parent_sdt45', function() {
            this.someMethod = function() {
                this.id213 = 123;
            };
        });
        let object = Factory.object('child_2135');
        assert.equal(typeof object.someMethod, 'function');
        object.someMethod();
        assert.equal(object.id213, 123);
    });
});

describe('.attributes', function(){

    it('no function property in resulting object', function * (){
        let res = Factory.attributes('with.trait', {}, { noText: true });
        assert.strictEqual(res.noText, undefined);
    });

    it('set user attributes', function * (){
        let attributes = Factory.attributes('user');
        expectUser(attributes);
    });

    it('set abstract attributes', function * (){
        Factory.define('abstract.attributes', function() {
            this.votes = Random.integer(0, 30);
        });
        let attributes = Factory.attributes('abstract.attributes');
        assert.equal(typeof attributes.votes, 'number');
    });
    it('set empty attributes', function * (){
        Factory.define('empty.attributes', User, function() { });
        let attributes = Factory.attributes('empty.attributes');
        assert.deepEqual(attributes, {});
    });
    it('trait applied', function * (){
        let res = Factory.attributes('with.trait', {}, { replaceText: 'new-value' });
        assert.equal(res.text, 'new-value');
    });
});

describe('.attributesArray', function(){
    it('set user attributes', function * (){
        let attributes = Factory.attributesArray('user', 2);
        assert.equal(attributes.length, 2);
        attributes = attributes[0];
        expectUser(attributes);
    });

    it('set abstract attributes', function * (){
        Factory.define('abstract.attributesArray', function() {
            this.votes = Random.integer(0, 30);
        });
        let attributes = Factory.attributesArray('abstract.attributesArray', 1);
        assert.equal(typeof attributes[0].votes, 'number');
    });
    it('set empty attributes', function * (){
        Factory.define('empty.attributesArray', User, function() { });
        let attributes = Factory.attributesArray('empty.attributesArray', 2);
        assert.equal(attributes.length, 2);
        assert.deepEqual(attributes[0], {});
    });

    it('default count is 1', function * (){
        let users = yield Factory.attributesArray('user');
        assert.equal(users.length, 1);
    });
    it('trait applied', function * (){
        let res = Factory.attributesArray('with.trait', 1, {}, { replaceText: 'new-value' });
        assert.equal(res[0].text, 'new-value');
    });
});


describe('.build', function(){
    it('user entry', function * (){
        let user = Factory.build('user');
        assert.equal(typeof user.toJSON(), 'object');
        expectUser(user);
    });

    it('user internal entries are build', function * (){
        let user = Factory.build('user');
        expectUser(user);
        assert.notEqual(user.meta, null);
        // votes
        assert(user.meta.votes > 0);
        assert.equal(typeof user.meta.votes, 'number');
        // favs
        assert(user.meta.favs > 0);
        assert.equal(typeof user.meta.favs, 'number');
    });

    it('user.meta entry throw an error', function * (){
        assert.throws(function(){
            Factory.build('user.meta');
        }, 'Mongo factory user.meta is absctract. No mongoose model attached to it');
    });

    it('trait applied', function * (){
        let res = Factory.build('with.trait', {}, { replaceText: 'new-value' });
        assert.equal(res.text, 'new-value');
    });
});

describe('.buildArray', function(){
    it('user entry', function * (){
        yield Factory.clean('user'); // clean all
        let users = yield Factory.buildArray('user'); // build 1
        expectUser(users[0]);
        let cntMongo = yield User.count();
        assert.equal(cntMongo, 0);
    });

    it('user.meta entry', function * (){
        assert.throws(function(){
            Factory.buildArray('user.meta'); //will throw same as build
        }, 'Mongo factory user.meta is absctract. No mongoose model attached to it');
    });

    it('default count is 1', function * (){
        let users = yield Factory.buildArray('user');
        assert.equal(users.length, 1);
    });

    it('trait applied', function * (){
        let res = Factory.buildArray('with.trait', 1, {}, { replaceText: 'new-value' });
        assert.equal(res[0].text, 'new-value');
    });
});

describe('.model', function(){
    it('get user model', function * (){
        let userModel = Factory.model('user');
        assert.deepEqual(userModel, User);
    });
});

describe('.create', function(){
    it('user entry', function * (){
        let user = yield Factory.create('user');
        assert(/[0-9a-f]{10,}/.test(user._id));
        assert.equal(typeof user.toJSON(), 'object');
        expectUser(user);
        let userMongo = yield User.findById(user._id).exec();
        expectUserEqual(user, userMongo.toObject());
    });

    it('user.meta entry', function * (){
        assert.throws(function(){
            Factory.create('user.meta'); //will throw same as build
        }, 'Mongo factory user.meta is absctract. No mongoose model attached to it');
    });

    it('trait applied', function * (){
        let res = yield Factory.create('with.trait', {}, { replaceText: 'new-value' });
        assert.equal(res.text, 'new-value');
    });
});

describe('.createArray', function(){
    it('user entry', function * (){
        yield Factory.clean('user'); // clean all
        let users = yield Factory.createArray('user', 2);
        assert.equal(users.length,2);
        assert.notEqual(users[0]._id, undefined);
        assert.notEqual(users[1]._id, undefined);
        expectUser(users[0]);
        expectUser(users[1]);
    });

    it('user.meta entry', function * (){
        assert.throws(function(){
            Factory.createArray('user.meta', 2); //will throw same as build
        }, 'Mongo factory user.meta is absctract. No mongoose model attached to it');
    });

    it('default count is 1', function * (){
        let users = yield Factory.createArray('user');
        assert.equal(users.length, 1);
    });

    it('trait applied', function * (){
        let res = yield Factory.createArray('with.trait', 1, {}, { replaceText: 'new-value' });
        assert.equal(res[0].text, 'new-value');
    });
});
