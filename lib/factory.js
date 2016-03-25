'use strict';

let merge = require('lodash.merge'),
    defaultMongooseProvider = require('./provider/mongoose');

class Factory {

    /*
        options:
        * errorPrefix - prefix for output errors
        * provider - persistance factory (mongoose is default)
     */
    constructor(options) {
        options = options || {};
        this.errorPrefix = options.errorPrefix || 'Mongo factory ';
        this.provider = options.provider || new defaultMongooseProvider();
        this.resetRegistry();
        this.resetGlobalTraits();
    }
    /*
        Do reset of global traits pool
     */
    resetGlobalTraits() {
        /*
            List of registered (global) traits
            Each trait accept value passed to it when called and temporary attributes object
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
    /*
        Do reset defined registry
     */
    resetRegistry() {
        /*
            registry: [{
                model: User reference to model object
                builder: function to build entry,
                parent: used in inheritance chain for attributes
            }]
         */
        this.registry = {};
    }
    /*
        Define
        + nameMixed - name or array of names with child-parent
        * model - class to be used to build new objects
        + builderFunction - function to setup attribute values
     */
    define (nameMixed, model, builderFunction) {
        if (builderFunction === undefined) {
            builderFunction = model;
            model = null;
        }
        if(!nameMixed) {
            throw new Error(`${this.errorPrefix} Definition require factory name to be specified`);
        }
        if(builderFunction === undefined){
            throw new Error(`${this.errorPrefix} ${nameMixed} definition don't have builder function`);
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
        + name - factory name
        * model - see .define
        * builderFunction - see .define
     */
    defineSingle (name, model, builderFunction) {
        let nameParts = this._checkNameAndSplit(name);
        this.registry[nameParts.name] = {
            model: model,
            parent: nameParts.parent,
            builder: builderFunction
        };
    }
    /*
        Model
     */
    model (name) {
        return this._checkAndGetDefinedModel(name);
    }
    /*
        Clean
     */
    clean (name, filter) {
        let model = this._checkAndGetDefinedModel(name);
        return this.provider.remove(model, filter || {});
    }
    /*
        Build
     */
    build (name, data, traits) {
        let model = this._checkAndGetDefinedModel(name);
        let attributes = this.attributes(name, data, traits);
        return this.provider.create(model, attributes);
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
        + name - factory name
        * data - data to be merged on top of genereted values
        * traits to be executed from global scope of locally defined in builder function
     */
    attributes (name, data, traits) {
        let result = this.object(name, data, traits);
        return this._removeFunctions(result);
    }
    /*
        Object
        + name - factory name
        * data - data to be merged on top of genereted values
        * traits to be executed from global scope of locally defined in builder function
     */
    object (name, data, traits) {
        traits = traits || {};
        this._checkDefined(name);

        let ctx = this;
        let registry = this.registry[name];
        let temp = {};
        // data and traits aplied only for current definition
        if(registry.parent) {
            temp = this.object(registry.parent);
        }
        // build current object
        registry.builder.call(temp, this);
        // list registered traits
        let registeredTraitNames = Object.keys(this.traits);
        // iterate over list and apply function trait
        Object.keys(traits).forEach(function(key) {
            let value = traits[key];
            // check trait defined globally
            if(registeredTraitNames.indexOf(key) !== -1) {
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
        // apply merge with provided 'data'
        return merge(temp, data || {});
    }
    /*
        Array methods for .object .attrbutes .create .build
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
    
    /*
        Private section. 
            Do not use those functions directly
            they could be changed any time
     */
    
    /*
        Do 'metod' 'count' times and return results
     */
    _buildAbstract(method, name, count, data, traits) {
        let result = [];
        count = count || 1;
        for(var i = 0; i < count; i++){
            result.push(this[method](name, data, traits));
        }
        return result;
    }
    /*
        Throw when no factory defined
     */
    _checkDefined(name) {
        if(!this.registry[name]) {
            throw new Error(`${this.errorPrefix} ${name} factory name is not defined`);
        }
    }
    /*
        Throw when no factory defined
        Throw when no model defined for factory
        Return factory model
     */
    _checkAndGetDefinedModel(name) {
        this._checkDefined(name);
        if(!this.registry[name].model){
            throw new Error(`${this.errorPrefix} ${name} is absctract. No model attached to it`);
        }
        return this.registry[name].model;
    }
    /*
        Throw: 
            Check name is a string
            Check name for multiple inheritance
            Check name for parent definition
            Check name is not yet defined
     */
    _checkNameAndSplit(name) {
        let parentName = null;

        if(typeof name !== 'string') {
            throw new Error(`${this.errorPrefix} ${name} definition name should be a string`);
        }
        if(name.indexOf('>') !== -1) {
            let parts = name.split('>').map(i => i.replace(/\s*/g, ''));
            if(parts.length > 2) {
                throw new Error(this.errorPrefix + name + 
                    ' definition have multiple inheritance. Use only one parent.'
                );
            }
            parentName = parts[1];
            if(this.registry[parentName] === undefined){
                throw new Error(`${this.errorPrefix} ${parentName} parent is not yet defined`);
            }
            name = parts[0];
        }
        if(this.registry[name] !== undefined){
            throw new Error(`${this.errorPrefix} ${name} is already defined`);
        }
        return {
            parent: parentName,
            name: name
        };
    }
    /*
        Remove functions from object
     */
    _removeFunctions(object) {
        Object.keys(object).forEach(function(key) {
            if(typeof object[key] === 'function') {
                delete object[key];
            }
        });
        return object;
    }
}

module.exports = Factory;
