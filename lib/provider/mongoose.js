'use strict';

class MongooseProvider {
    /*
        Return Promise
        * resolve updated/saved object
     */
    save(model) {
        return model.save();
    }
    /*
        Return Promise
        * resolve anything
     */
    remove(model, filter) {
        return model.remove(filter).exec();
    }
    /*
        Return Model Object
     */
    build(model, attributes) {
        return new model(attributes);
    }
    /*
        Return Promise
        * resolve array of objects
     */
    find(model, filter) {
        return model.find(filter).exec();
    }
    /*
        Return Promise
        * resolve object
     */
    findOne(model, filter) {
        return model.findOne(filter).exec();
    }
};

module.exports = MongooseProvider;
