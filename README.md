# About

![https://travis-ci.org/omakoleg/co-famo](https://travis-ci.org/omakoleg/co-famo.svg?branch=master)

Simple npm for creating mongoose models in test cases.
Async actions returns promise. This allow to use it in `koa` framework. 

# Upgrate notes for 2.x
Creating new factory
```javascript
let cofamo = require('co-famo');
let Factory = new cofamo.Factory();
```
Providing options to factory
```javascript
let cofamo = require('co-famo');
let Factory = new cofamo.Factory({
    errorPrefix: 'My fancy factory',
    provider: { object for working with provided models}
});
```
Default persisting provider is mongoose. Provider interface description [Sample Provider explained](PROVIDER.md)
You could change provider (example for simple memory provider):
```javascript
let cofamo = require('co-famo');
let factory = new cofamo.Factory({
    provider: new cofamo.MemoryProvider()
});
// define model class
class MemoryModel {
    constructor(attr) {
        this.a = attr.a;
    }
}
// define factory
factory.define('test', MemoryModel, function(){
    this.a = 1;
})
// get object form model
factory.build('test') /// { a: 1 }
```
Example of simple provider could be found in `lib/provider/memory`


# Options

- errorPrefix - log prefix for messages
- provider - custom persisting factory

# Installation

To install simply use :
```javascript
npm install co-famo --save-dev
// optional 
npm install random-js --save-dev
```
### Runnign tests

Running tests do not require mongo to be installed. Tests use mockgoose for it.
```javascript
npm test
```
Tests written with `co-mocha`

# API

#### Model
 - `model(name)` - get mongoose model class


#### Define
 - `define(name, model, builder)` - define new factory.
 - `define(name, builder)` - define new abstract factory. No build and create here
 - `define([name, name2, name3], ... )` - define new factory with aliases.
 
Parameter name could specify `parent`, it will be used to populate paramenters before current factory. Object with those data will be used as `this` for current builder
 - `define('child_name > parent_name', ... )` - define new factory with parent.
 - `define(['child_name > parent_name', 'child2 > parent2'], ... )` - define new factory with aliases.

#### Object
Will keep all defined traits in object. Name could also have parent reference
 - `object(name)` - create obejct from factory attributes
 - `object(name, data)` - create object with attributes owervritten dey `data` values 
 - `object(name, data, traits)` - generate object using builder function

#### Attributes
 - `attributes(name)` - create object with attributes
 - `attributes(name, data)` - create object with specific data
 - `attributes(name, data, traits)` - generate object using builder function
 
#### Build
 - `build(name)`
 - `build(name, data)`
 - `build(name, data, traits)` - generate model object using builder function
 
#### Create
 - `create(name)`
 - `create(name, data)`
 - `create(name, data, traits)` - generate and save model using builder function
 
#### Clean
 - `clean(name)`, `clean(name, query)` - remove entries from database. All or using filter
 
#### Array methods: attributes, object, build, create
 - `[method](name)` Default count is 1
 - `[method](name, count)`
 - `[method](name, count, data)`
 - `[method](name, count, data, traits)`


# Note for generating entry values

Prefferable to use `random-js` to generate each value as somehting random. 
```javascript
let Random = require('random-js')();

Factory.define('user.meta', function(lib) {
    this.votes = Random.integer(0, 30);
    this.body = Random.hex(40);
});
```
# Best practice for using in tests
You can't know dynamic value of entry and can't rely on its value without directly specifying it.

```javascript
Factory.define('user', function(lib) {
    this.votes = 30;
    this.body = 'abcdef';
});
let attributes = Factory.attributes('user');

let responseEntry = doSomething(attributes); // will return entry

// bad way. When votes will be set to 40 in some time it will break
expect(responseEntry.votes).to.eql(30);
expect(responseEntry.body).to.eql('abcdef');

// better way. You dont know votes actual value
// but comparing with actual one will not break 
expect(responseEntry.votes).to.eql(attributes.votes);
expect(responseEntry.body).to.eql(attributes.body);
```

Another example when we test expected value which we provided:

```javascript
Factory.define('user', function(lib) {
    this.votes = 30;
    this.body = 'abcdef';
});
// set votes to be what we expect in current test
// so overwrite it so expect it to match our custom value
let attributes = Factory.attributes('user', { votes: 231 });
...
let responseEntry = doSomething(attributes); // will return entry
...
expect(responseEntry.votes).to.eql(231);
```

# Usage
All examples has `Factory` initialised:
```
let cofamo = require('co-famo');
let Factory = new cofamo.Factory();
```

Define accept builder funciton with one argument which set to current factory object. 

Traits add custom functions to modify resulting object. They run in context `this` set to resulting object so you could reference `this.body` properties of result.
Trait `{magic: '-join-'}` accept value passed as first argument and factory object as second.
```javascript
Factory.define('etc', function(lib) {
    this.body = 'aaa';
    this.text = 'bbb';
    this.magic = function(value, factory){
      this.computed =  this.text + value + this.body;
  }
});

// will create object with key computed set to 'aaa--bbb'
Factory('etc', {}, {magic: '--'})


```

So all public methods available to use:

```javascript
Factory.define('something', function(lib) {
    this.subentry = lib.attributes('something.else');
    this.subentriesArray = lib.attributesArray('something.else.array', 2);
});

Factory.define('with.trait', function(lib) {
    this.body = Random.hex(32);
    this.text = Random.hex(32);
    this.computed = '';

    this.magic = function(value, factory){
        this.computed =  this.text + this.body;
    }
});
```
## Define factory with parent
```javascript
Factory.define('parent', function(lib) {
    this.parentId = Random.hex(32);
});

Factory.define('child > parent', function(lib) {
    this.childId = Random.hex(32);
});
// as result it will create:
{
	parentId: ... ,
	childId: ...
}

```

## Define factory without model
```javascript
Factory.define('requestAttributes', function(lib) {
    this.body = Random.hex(32);
    this.date = new Date();
});

```

## Define factory with model

```javascript
var User = mongoose.model('User', mongoose.Schema({
    name:  String,
    body:   String,
}));

Factory.define('user', User, function(lib) {
    this.name = 'test user';
    this.body = 'something';
});
```

## Get attributes

```javascript
let attrs = Factory.attributes('requestAttributes');
```
or
```javascript
let attrs = Factory.attributes('requestAttributes', {
	body: 'some other value'
});
```

## Build model 

Could build only `model` entities.
```javascript
var User = mongoose.model('User', mongoose.Schema({
    name:  String,
    age:  Number
}));

Factory.define('user', User, function(lib) {
    this.name = 'test user';
    this.age = 30;
});

let entityNotSaved = Factory.build('user', {
	age: 20
});
// entityNotSaved - object
```
Array version
```javascript
let entitiesNotSaved = Factory.buildArray('user', {
	age: 20
}, 5);
// entitiesNotSaved - array of 5 objects
```

## Create model 

Could build only `model` entities. Will persist each object to mongo
```javascript
var User = mongoose.model('User', mongoose.Schema({
    name:  String,
    age:  Number
}));

Factory.define('user', User, function(lib) {
    this.name = 'test user';
    this.age = 30;
});

let entitySaved = Factory.create('user', {
	age: 20
});
// entitySaved - object
```
Array version
```javascript
let entitiesSaved = Factory.buildArray('user', {
	age: 20
}, 5);
// entitiesSaved - array of 5 saved objects
```

## Clean entries

```javascript
yield Factory.create('user', {name: 'test'});
yield Factory.create('user');

yield Factory.clean('user', {name: 'test'}); //will delete all users with name: test
yield Factory.clean('user'); //will delete all users

```

## Get model class

Throw exception if it is not models factory

```javascript
let UserModel = Factory.model('user');

```
## Create custom global traits

```javascript
// Use property to define trait
Factory.traits.custom = function(mixedValue, attributes) {
	attributes._id = 'some-id-' + mixedValue;
};
// define factory
Factory.define('user', function(lib) {
    this.name = 'test user';
});
// create object with trait
let userWithId = Factory.attributes('user', {}, { custom: '10'});
/* userWithId:
{
  name: 'test user',
  _id: 'some-id-10'
}
*/
```
# Use functions inheritance
```javascript
Factory.define('parent', function() {
    this.someMethod = function() {
        this.id213 = 567;
    };
});
Factory.define('child > parent', function() {
    this.someMethod = function() {
        this.id213 = 123;
    };
});
let object = Factory.object('child');
//
obeject.someMethod(); // will set 123 from top child in chain
```
# Changelog
[Changelog file](CHANGELOG.md)

#TODO
- tests for memory provider
- tests for mongoose provider
- refactor tests to use groupping by describe

#Licence

The MIT License (MIT)
Copyright (c) 2016 Oleg Makiienko

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
