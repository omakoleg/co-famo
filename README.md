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


# API

#### Model
 - `model(name)` - get mongoose model class


#### Define
 - `define(name, model, builder)` - define new factory.
 - `define(name, builder)` - define new abstract factory. No build and create here
 - `define([name, name2, name3], ... )` - define new factory with aliases.
 
Parameter name could specify `parent`, it will be used to populate paramenters before current factory. Object with those data will be used as `this` for current builder
 - `define('child_name > parent_name', ... )` - define new factory with aliases.
 - `define(['child_name > parent_name', 'child2 > parent2'], ... )` - define new factory with aliases.

 
#### Attributes
 - `attributes(data)`
 - `attributes(data, traits)` - generate object using builder function
 
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
 
#### Array attributes, build, create
 - `method(name)` Default count is 1
 - `method(name, count)`
 - `method(name, count, data)`
 - `method(name, count, data, traits)`


##### Note for generating entry values

Prefferable to use `random-js` to generate each value as somehting random. 
```
let Random = require('random-js')();

Factory.define('user.meta', function(lib) {
    this.votes = Random.integer(0, 30);
    this.body = Random.hex(40);
});
```
##### Best practice
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

Define accept builder funciton with one argument which set to current factory object. 

Traits add custom functions to modify resulting object. They run in context `this` set to resulting object so you could reference `this.body` properties of result.
Trait `{magic: '-join-'}` accept value passed as first argument and factory object as second.
```
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

```
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
```
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

## Get model class

Throw exception if it is not models factory

```
let UserModel = Factory.model('user');

```


#TODO

- traits
- accept options
- list all
- get one



