'use strict';

let Factory = require('./lib/factory'),
    MemoryProvider = require('./lib/provider/memory'),
    MongooseProvider = require('./lib/provider/mongoose');

/*
    Exports
 */
module.exports = {
    Factory: Factory,
    // different predefined providers
    MongooseProvider: MongooseProvider,
    MemoryProvider: MemoryProvider
};
