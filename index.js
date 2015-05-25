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
    Helpers
 */
object.rndHex = function(length) {
    return crypto.randomBytes(Math.ceil(length/2))
        .toString('hex') // convert to hexadecimal format
        .slice(0,length);   // return required number of characters
}

object.rndNumber = function(minNumber, maxNumber) {
    minNumber = minNumber || 0;
    maxNumber = maxNumber || 1000;
    return Math.floor(Math.random() * (maxNumber - minNumber + 1) + minNumber);
}

object.rndDate = function(maxDate, minDate) {
    var min = 0, 
        max = new Date().getTime(),
        value;

    if(typeof maxDate === 'object'){
        max = maxDate.getTime();
    }
    if(typeof maxDate === 'Number'){
        max = maxDate;
    }
    if(typeof minDate === 'object'){
        min = minDate.getTime();
    }
    if(typeof minDate === 'Number'){
        min = minDate;
    }
    value = rndNumber(min, max);
    return new Date(value);
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
        result.push(attributes(name, data));
    };
    return result;
}; 
object.createArray = function(name, count, data) {
    let result = [];
    for(var i = 0; i < count; i++){
        result.push(create(name, data));
    };
    return result;
};
object.buildArray = function(name, count, data) {
    let result = [];
    for(var i = 0; i < count; i++){
        result.push(build(name, data, options));
    };
    return result;
};



module.exports = object;



