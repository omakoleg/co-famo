'use strict';

let merge = require('lodash.merge'),
    defaultMongooseProvider = require('./provider/mongoose');

class Factory {

    constructor(options) {
        options = options || {};
        this.errorPrefix = options.errorPrefix || 'Mongo factory ';
        this.provider = options.provider || new defaultMongooseProvider();
        /*
            registry: [{
                model: User reference to mongo object
                builder: function to build entry,
                parent: used tin ingeritance chain for attributes
            }]
         */
        this.registry = {};
        /*
            List of registered (global) traits
            Each trait accept value passed to it whaen called and temporary attributes object
            which could be modified by trait before returning back or using in build/create
         */
        this.traits = {};

        /*
            Remove listed keys from resulted object
         */
        this.traits.omit = function(mixedValue, atributes) {
            if(!Array.isArray(mixedValue)) {
                mixedValue = [mixedValue];
            }
            mixedValue.forEach(function(omitValue){
                delete atributes[omitValue.toString()];
            });
        }  
    }

    cleanRegistry() {
        this.registry = {};
    }
    /*
        Define
     */
    define (nameMixed, model, builderFunction) {
        if (builderFunction === undefined) {
            builderFunction = model;
            model = null;
        }
        if(!nameMixed) {
            throw new Error(this.errorPrefix + 'Definition require factory name to be specified');
        }
        if(builderFunction === undefined){
            throw new Error(this.errorPrefix + nameMixed + ' definition don\'t have builder function');
        }
        if(!Array.isArray(nameMixed)) {
            nameMixed = [nameMixed];
        }
        for(let name of nameMixed) {
            this.defineSingle(name, model, builderFunction);
        }
    }
    /*
        Define sinle
     */
    defineSingle (name, model, builderFunction) {
        if(typeof name !== 'string') {
            throw new Error(this.errorPrefix + name + ' definition name should be a string');
        }
        let parentName = null;
        if(name.indexOf('>') !== -1) {
            let parts = name.split('>').map(i => i.replace(/\s*/g, ''));
            if(parts.length > 2) {
                throw new Error(this.errorPrefix + name + 
                    ' definition have multiple inheritance. Use only one parent.'
                );
            }
            parentName = parts[1];
            if(this.registry[parentName] === undefined){
                throw new Error(this.errorPrefix + parentName + ' parent not defined');
            }
            name = parts[0];
        }
        if(this.registry[name] !== undefined){
            throw new Error(this.errorPrefix + name + ' already defined');
        }
        this.registry[name] = {
            model: model,
            parent: parentName,
            builder: builderFunction
        };

    }
    /*
        Model
     */
    model (name) {
        if(!this.registry[name].model){
            throw new Error(errorPrefix + name + ' is absctract. No mongoose model attached to it');
        }
        return this.registry[name].model;
    }
    /*
        Clean
     */
    clean (name, filter) {
        if(!this.registry[name].model){
            throw new Error(errorPrefix + name + ' is absctract. No mongoose model attached to it');
        }
        filter = filter || {};
        return this.provider.remove(this.registry[name].model, filter);
    }
    /*
        Build
     */
    build (name, data, traits) {
        if(!this.registry[name].model){
            throw new Error(errorPrefix + name + ' is absctract. No mongoose model attached to it');
        }
        let attributes = this.attributes(name, data, traits);
        return this.provider.create(this.registry[name].model, attributes);
    }
    /*
        Create
     */
    create (name, data, traits) {
        let entry = this.build(name, data, traits);
        return this.provider.save(entry);
    }
    /*
        Attributes
     */
    attributes (name, data, traits) {
        // proxy to 'object'
        let result = this.object(name, data, traits);
        // clean functions
        Object.keys(result).forEach(function(key) {
            if(typeof result[key] === 'function') {
                delete result[key];
            }
        });
        // return object without functions
        return result;
    }
    /*
        Object
     */
    object (name, data, traits) {
        let ctx = this;
        if(this.registry[name] === undefined){
            throw new Error(errorPrefix + name + 
                ' is not defined. Use Factory.define() to define new factories'
            );
        }
        let registry = this.registry[name];
        let temp = {};
        if(registry.parent) {
            temp = this.object(registry.parent);
        }
        registry.builder.call(temp, this);
        // run each trait in context of builded cofamo
        // pass trait value to function
        traits = traits || {}; //default value
        // list registered traits
        let registeredTraits = Object.keys(this.traits);
        // iterate over list and apply function trait
        Object.keys(traits).forEach(function(key) {
            let value = traits[key];
            // check trait defined globally
            if(registeredTraits.indexOf(key) !== -1) {
                ctx.traits[key](value, temp);
            // check trait is for factory only
            } else if(typeof temp[key] === 'function') {
                temp[key].call(temp, value, ctx);
            // no trait found
            } else {
                throw new Error(errorPrefix +  key + 
                    ' trait is not defined. Use function declaration within Factory.define() to define new trait'
                );
            }
        });

        return merge(temp, data || {});
    }
    /*
        Array methods
     */
    objectArray (name, count, data, traits) {
        return this._buildAbstract('object', name, count, data, traits);
    }
    attributesArray (name, count, data, traits) {
        return this._buildAbstract('attributes', name, count, data, traits);
    }
    createArray (name, count, data, traits) {
        return this._buildAbstract('create', name, count, data, traits);
    }
    buildArray(name, count, data, traits) {
        return this._buildAbstract('build', name, count, data, traits);
    }
    _buildAbstract(method, name, count, data, traits) {
        let result = [];
        count = count || 1;
        for(var i = 0; i < count; i++){
            result.push(this[method](name, data, traits));
        }
        return result;
    }
}

module.exports = Factory;
