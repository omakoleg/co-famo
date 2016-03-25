'use strict';

class MemoryProvider {
    
    constructor() {
        this.storage = {};
        this._id = 1;
    }
    /*
        Return Promise
        * save model with _id
        * return object
     */
    save(model) {
        model._id = ( ++ this._id);
        this.storage[model._id] = model;
        return Promise.resolve(model);
    }
    /*
        Return Promise
        * delete by _id
        * return 1
     */
    remove(model, filter) {
        if(filter._id) {
            delete this.storage[filter._id];
        }
        return Promise.resolve(1);
    }
    /*
        Return Model Object
        * create new object
     */
    create(model, attributes) {
        return new model(attributes);
    }
    /*
        Return Promise
        * find one by _id
        * return array
     */
    find(model, filter) {
        let found = [];
        for(let id of Object.keys(this.storage)) {
            if(filter._id === this.storage[id]._id) {
                found.push(this.storage[id]);
            }
        }
        return Promise.resolve(found);
    }
    /*
        Return Promise
        * find any by _id
        * return object
     */
    findOne(model, filter) {
        let found = null;
        for(let id of Object.keys(this.storage)) {
            if(filter._id === this.storage[id]._id) {
                found = this.storage[id];
            }
        }
        return Promise.resolve(found);
    }
};

module.exports = MemoryProvider;
