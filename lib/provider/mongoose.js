'use strict';

class MongooseProvider {
    save(model) {
        return model.save();
    }
    remove(model, filter) {
        return model.remove(filter).exec();
    }
    create(model, attributes) {
        return new model(attributes);
    }
};

module.exports = MongooseProvider;
