'use strict';

let errorPrefix = 'Mongo factory ',
    merge = require('lodash.merge'),
    cofamo = {};

/*
    registry: [{
        model: User reference to mongo object
        builder: function to build entry,
        parent: used tin ingeritance chain for attributes
    }]
 */
cofamo.registry = [];
/*
    List of registered (global) traits
    Each trait accept value passed to it whaen called and temporary attributes object
    which could be modified by trait before returning back or using in build/create
 */
cofamo.traits = {
    /*
        Remove listed keys from resulted object
     */
    omit: function(mixedValue, atributes) {
        if(!Array.isArray(mixedValue)) {
            mixedValue = [mixedValue];
        }
        mixedValue.forEach(function(omitValue){
            delete atributes[omitValue.toString()];
        });
    }
};

/*
    Define:
        Factory.define(<name>, <model>, <builder funciton>);
        Factory.define(<name>, <builder funciton>);
        Factory.define([<name>, <name alias>, ... ], ...);

    Throw cases: 
        redefine
        builder function required
 */
cofamo.define = function(nameMixed, model, builderFunction) {
    if (builderFunction === undefined) {
        builderFunction = model;
        model = null;
    }
    if(!nameMixed) {
        throw new Error(errorPrefix + 'Definition require factory name to be specified');
    }
    if(builderFunction === undefined){
        throw new Error(errorPrefix + nameMixed + ' definition don\'t have builder function');
    }
    if(!Array.isArray(nameMixed)) {
        nameMixed = [nameMixed];
    }
    for(let name of nameMixed) {
        cofamo.defineSingle(name, model, builderFunction);
    }
};

cofamo.defineSingle = function(name, model, builderFunction) {
    if(typeof name !== 'string') {
        throw new Error(errorPrefix + name + ' definition name should be a string');
    }
    let parentName = null;
    if(name.indexOf('>') !== -1) {
        let parts = name.split('>').map(i => i.replace(/\s*/g, ''));
        if(parts.length > 2) {
            throw new Error(errorPrefix + name + 
                ' definition have multiple inheritance. Use only one parent.'
            );
        }
        parentName = parts[1];
        if(cofamo.registry[parentName] === undefined){
            throw new Error(errorPrefix + parentName + ' parent not defined');
        }
        name = parts[0];
    }
    if(cofamo.registry[name] !== undefined){
        throw new Error(errorPrefix + name + ' already defined');
    }
    cofamo.registry[name] = {
        model: model,
        parent: parentName,
        builder: builderFunction
    };
};

/*
    Actions
 */
/*
    Get model class by it's name

    Clean:
        Factory.model(<name>);
 */
cofamo.model = function(name) {
    if(!cofamo.registry[name].model){
        throw new Error(errorPrefix + name + ' is absctract. No mongoose model attached to it');
    }
    return cofamo.registry[name].model;
};
/*
    Remove models from db by name

    Clean:
        Factory.clean(<name>);
        Factory.clean(<name>, <mongoose query to use in remove>)
 */
cofamo.clean = function(name, filter) {
    if(!cofamo.registry[name].model){
        throw new Error(errorPrefix + name + ' is absctract. No mongoose model attached to it');
    }
    filter = filter || {};
    return cofamo.registry[name].model.remove(filter).exec();
};
/*
    Create new Object (without saving)

    Build:
        Factory.build(<name>);
        Factory.build(<name>, <data to be merged>)
    Throws:
        factory is abstract
 */
cofamo.build = function(name, data, traits) {
    if(!cofamo.registry[name].model){
        throw new Error(errorPrefix + name + ' is absctract. No mongoose model attached to it');
    }
    let attributes = cofamo.attributes(name, data, traits);
    return new cofamo.registry[name].model(attributes);
};
/*
    Create new Object (with saving)

    Build:
        Factory.create(<name>);
        Factory.create(<name>, <data to be merged>)
    Throw cases:
        see .build cases
 */
cofamo.create = function(name, data, traits) {
    let entry = cofamo.build(name, data, traits);
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
cofamo.attributes = function(name, data, traits) {
    // proxy to 'object'
    let result = cofamo.object(name, data, traits);
    // clean functions
    Object.keys(result).forEach(function(key) {
        if(typeof result[key] === 'function') {
            delete result[key];
        }
    });
    // return object without functions
    return result;
};

cofamo.object = function(name, data, traits) {
    if(cofamo.registry[name] === undefined){
        throw new Error(errorPrefix + name + 
            ' is not defined. Use Factory.define() to define new factories'
        );
    }
    let registry = cofamo.registry[name];
    let temp = {};
    if(registry.parent) {
        temp = cofamo.attributes(registry.parent);
    }
    registry.builder.call(temp, cofamo);
    // run each trait in context of builded cofamo
    // pass trait value to function
    traits = traits || {}; //default value
    // list registered traits
    let registeredTraits = Object.keys(cofamo.traits);
    // iterate over list and apply function trait
    Object.keys(traits).forEach(function(key) {
        let value = traits[key];
        // check trait defined globally
        if(registeredTraits.indexOf(key) !== -1) {
            cofamo.traits[key](value, temp);
        // check trait is for factory only
        } else if(typeof temp[key] === 'function') {
            temp[key].call(temp, value, cofamo);
        // no trait found
        } else {
            throw new Error(errorPrefix +  key + 
                ' trait is not defined. Use function declaration within Factory.define() to define new trait'
            );
        }
    });

    return merge(temp, data || {});
};
/*
    Bulk actions
 */
/*
    See .attributes
 */
cofamo.attributesArray = function(name, count, data, traits) {
    let result = [];
    count = count || 1;
    for(var i = 0; i < count; i++){
        result.push(cofamo.attributes(name, data, traits));
    }
    return result;
}; 
/*
    See .create
 */
cofamo.createArray = function(name, count, data, traits) {
    let result = [];
    count = count || 1;
    for(var i = 0; i < count; i++){
        result.push(cofamo.create(name, data, traits));
    }
    return result;
};
/*
    See .build
 */
cofamo.buildArray = function(name, count, data, traits) {
    let result = [];
    count = count || 1;
    for(var i = 0; i < count; i++){
        result.push(cofamo.build(name, data, traits));
    }
    return result;
};

module.exports = cofamo;
