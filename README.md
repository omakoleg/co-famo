# About

Simple npm for creating mongoose models in test cases.
Async actions returns promise. This allow to use it in `koa` framework. 

# Requrements

- Require mongoose connection to be initialised before

# Installation

To install simply use :
```
npm install co-famo --save-dev
```
Run test suite to make sure it is working. Clone repository and run:
```
npm test
```
Tests written with `co-mocha` and `chai.expect`

# Usage

## Define factory without model
```
Factory.define('requestAttributes', function(lib) {
    this.body = Random.hex(32);
    this.date = new Date();
});

```




