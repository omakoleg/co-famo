'use strict';

class MongooseProvider {
    /*
        Return Promise
     */
    save(model) {
        return model.save();
    }
    /*
        Return Promise
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
     */
    find(model, filter) {
        return model.find(filter).exec();
    }
    /*
        Return Promise
     */
    findOne(model, filter) {
        return model.findOne(filter).exec();
    }

};

module.exports = MongooseProvider;
