# About

Simple npm for creating mongoose models in test cases.
Async actions returns promise. This allow to use it in `koa` framework. 

# Requrements

- Require mongoose connection to be initialised before

# Installation

To install simply use :
```
npm install p7s1-ctf/co-famo --save-dev
// optional 
npm install random-js --save-dev
```
Run test suite to make sure it is working. Clone repository and run:
```
npm test
```
Tests written with `co-mocha` and `chai.expect`


### API

 - `define` - define new factory.
 - `attributes` - generate object using builder function
 - `build` - generate model object using builder function
 - `create` - generate and save model using builder function
 - `clean` - remove entries from database. All or using filter
 - `attributesArray` - generate objects array using builder function. Default is 1
 - `buildArray` - generate models array using builder function. Default is 1
 - `createArray` - generate and save models array using builder function. Default is 1


### Note for generating entry values

Prefferable to use `random-js` to generate each value as somehting random. 
```
let Random = require('random-js')();

Factory.define('user.meta', function(lib) {
    this.votes = Random.integer(0, 30);
    this.body = Random.hex(40);
});
```
### Best practice
You can't know dynamic value of entry and can't rely on its value without directly specifying it.

```
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

```
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

Define accept builder funciton with one argument which set to current factory object. So all public methods available to use:
```
Factory.define('something', function(lib) {
    this.subentry = lib.attributes('something.else');
    this.subentriesArray = lib.attributesArray('something.else.array', 2);
});
```

## Define factory without model
```
Factory.define('requestAttributes', function(lib) {
    this.body = Random.hex(32);
    this.date = new Date();
});

```

## Define factory with model

```
var User = mongoose.model('User', mongoose.Schema({
    name:  String,
    body:   String,
}));

Factory.define('user', User, function(lib) {
    this.name = 'test user;
    this.body = 'something';
});
```

## Get attributes

```
let attrs = Factory.attributes('requestAttributes');
```
or
```
let attrs = Factory.attributes('requestAttributes', {
	body: 'some other value'
});
```

## Build model 

Could build only `model` entities.
```
var User = mongoose.model('User', mongoose.Schema({
    name:  String,
    age:  Number
}));

Factory.define('user', User, function(lib) {
    this.name = 'test user;
    this.age = 30;
});

let entityNotSaved = Factory.build('user', {
	age: 20
});
// entityNotSaved - object
```
Array version
```
let entitiesNotSaved = Factory.buildArray('user', {
	age: 20
}, 5);
// entitiesNotSaved - array of 5 objects
```

## Create model 

Could build only `model` entities. Will persist each object to mongo
```
var User = mongoose.model('User', mongoose.Schema({
    name:  String,
    age:  Number
}));

Factory.define('user', User, function(lib) {
    this.name = 'test user;
    this.age = 30;
});

let entitySaved = Factory.create('user', {
	age: 20
});
// entitySaved - object
```
Array version
```
let entitiesSaved = Factory.buildArray('user', {
	age: 20
}, 5);
// entitiesSaved - array of 5 saved objects
```

## Clean entries

```
yield Factory.create('user', {name: 'test'});
yield Factory.create('user');

yield Factory.clean('user', {name: 'test'}); //will delete all users with name: test
yield Factory.clean('user'); //will delete all users

```


#TODO

- traits
- accept options
- list all
- get one



