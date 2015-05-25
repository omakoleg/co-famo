'use strict';

let crypto = require('crypto'),
    _ = require('lodash'),
    object = {
        registry: []
    };
/*
    model: User reference to mongo object
    builder: function to build entry
 */
/*
    Define
 */
object.define = function(name, model, builderFunction) {
    if (builderFunction === undefined) {
        builderFunction = model;
        model = null;
    }
    if(object.registry.name !== undefined){
        throw new Error('Mongo factory ' + name + ' already defined');
    }
    object.registry[name] = {
        model: model,
        builder: builderFunction
    };
}

/*
    Actions
 */
object.build = function(name, data) {
    if(object.registry[name].model === undefined){
        throw new Error('Mongo factory ' + name + ' is absctract. No mongoose model attached to it.');
    }
    let attributes = object.attributes(name, data);
    return new object.registry[name].model(attributes);
};
object.create = function(name, data) {
    let entry = object.build(name, data);
    return new Promise(function(resolve, reject){
        entry.save(function (err, record) {
            if (err) {
                return reject(err);
            }
            resolve(record);
        });
    });
};
object.attributes = function(name, data) {
    if(object.registry[name] === undefined){
        throw new Error('Mongo factory ' + name + ' is not defined. Use Factory.define() to define new factories');
    }
    let temp = {};
    object.registry[name].builder.call(temp, object);
    return _.merge(temp, data || {});
};

object.attributesArray = function(name, count, data) {
    let result = [];
    for(var i = 0; i < count; i++){
        result.push(object.attributes(name, data));
    };
    return result;
}; 
object.createArray = function(name, count, data) {
    let result = [];
    for(var i = 0; i < count; i++){
        result.push(object.create(name, data));
    };
    return result;
};
object.buildArray = function(name, count, data) {
    let result = [];
    for(var i = 0; i < count; i++){
        result.push(object.build(name, data, options));
    };
    return result;
};

module.exports = object;



