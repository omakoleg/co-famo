'use strict';

let _ = require('lodash'),
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
    Define:
        Factory.define(<name>, <model>, <builder funciton>);
        Factory.define(<name>, <builder funciton>);

    Throw cases: 
        redefine
        builder function required
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
/*
    Remove models from db by name

    Clean:
        Factory.clean(<name>);
        Factory.clean(<name>, <mongoose query to use in remove>)
 */
object.clean = function(name, filter) {
    if(!object.registry[name].model){
        throw new Error('Mongo factory ' + name + ' is absctract. No mongoose model attached to it');
    }
    filter = filter || {};
    return object.registry[name].model.remove(filter).exec();
};
/*
    Create new Object (without saving)

    Build:
        Factory.build(<name>);
        Factory.build(<name>, <data to be merged>)
    Throws:
        factory is abstract
 */
object.build = function(name, data) {
    if(!object.registry[name].model){
        throw new Error('Mongo factory ' + name + ' is absctract. No mongoose model attached to it');
    }
    let attributes = object.attributes(name, data);
    return new object.registry[name].model(attributes);
};
/*
    Create new Object (with saving)

    Build:
        Factory.create(<name>);
        Factory.create(<name>, <data to be merged>)
    Throw cases:
        see .build cases
 */
object.create = function(name, data) {
    let entry = object.build(name, data);
    return entry.save();
};
/*
    Create object attributes

    Build:
        Factory.attributes(<name>);
        Factory.attributes(<name>, <data to be merged>)
    Throw cases:
        factory not defined
 */
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
/*
    See .attributes
 */
object.attributesArray = function(name, count, data) {
    let result = [];
    count = count || 1;
    for(var i = 0; i < count; i++){
        result.push(object.attributes(name, data));
    };
    return result;
}; 
/*
    See .create
 */
object.createArray = function(name, count, data) {
    let result = [];
    count = count || 1;
    for(var i = 0; i < count; i++){
        result.push(object.create(name, data));
    };
    return result;
};
/*
    See .build
 */
object.buildArray = function(name, count, data) {
    let result = [];
    count = count || 1;
    for(var i = 0; i < count; i++){
        result.push(object.build(name, data));
    };
    return result;
};

module.exports = object;



