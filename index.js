'use strict';

let crypto = require('crypto'),
    _ = require('lodash'),
    object = {
        registry: []
    };
/*
    registry: [{
        model: User reference to mongo object
        builder: function to build entry
    }]
 */
/*
    Define
 */
object.define = function(name, model, builderFunction) {
    if (builderFunction === undefined) {
        builderFunction = model;
        model = null;
    }
    if(object.registry[name] !== undefined){
        throw new Error('Mongo factory ' + name + ' already defined');
    }

    if(builderFunction === undefined){
        throw new Error('Mongo factory ' + name + ' definition don\'t have builder function');
    }
    object.registry[name] = {
        model: model,
        builder: builderFunction
    };
}

/*
    Actions
 */
object.clean = function(name, filter) {
    if(!object.registry[name].model){
        throw new Error('Mongo factory ' + name + ' is absctract. No mongoose model attached to it');
    }
    filter = filter || {};
    return object.registry[name].model.remove(filter).exec();
};

object.build = function(name, data) {
    if(!object.registry[name].model){
        throw new Error('Mongo factory ' + name + ' is absctract. No mongoose model attached to it');
    }
    let attributes = object.attributes(name, data);
    return new object.registry[name].model(attributes);
};

object.create = function(name, data) {
    let entry = object.build(name, data);
    return entry.save();
};

object.attributes = function(name, data) {
    if(object.registry[name] === undefined){
        throw new Error('Mongo factory ' + name + ' is not defined. Use Factory.define() to define new factories');
    }
    let temp = {};
    object.registry[name].builder.call(temp, object);
    return _.merge(temp, data || {});
};
/*
    Bulk actions
 */
object.attributesArray = function(name, count, data) {
    let result = [];
    count = count || 1;
    for(var i = 0; i < count; i++){
        result.push(object.attributes(name, data));
    };
    return result;
}; 
object.createArray = function(name, count, data) {
    let result = [];
    count = count || 1;
    for(var i = 0; i < count; i++){
        result.push(object.create(name, data));
    };
    return result;
};
object.buildArray = function(name, count, data) {
    let result = [];
    count = count || 1;
    for(var i = 0; i < count; i++){
        result.push(object.build(name, data));
    };
    return result;
};

module.exports = object;



