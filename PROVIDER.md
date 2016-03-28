# Format definition for provider

WHan creating new factory you could specify custom persistance factory for data (provider).

Providing options to factory
```javascript
let cofamo = require('co-famo');
let Factory = new cofamo.Factory({
    provider: new CustomProvider( ... )
});
```
Example of provider class

```javascript
class CustomProvider {
    /*
        Return Promise
        * resolve updated/saved object
     */
    save(model)
    /*
        Return Promise
        * resolve anything
     */
    remove(model, filter)
    /*
        Return Model Object
     */
    build(model, attributes)
    /*
        Return Promise
        * resolve array of objects
     */
    find(model, filter)
    /*
        Return Promise
        * resolve object
     */
    findOne(model, filter)
};
```

# Provider API

- `save(model)` Accept model object to be persisted into storage, return Promise resolving to persisted object
- `remove(model, filter)` Do remove / clean, could resolves to anything
- `build(model, attributes)` - Accept model definition and data attributes, returns object created from `model` with `attributes` data
- `find(model, filter)` - Accept model and filtering object, return Promise resolved to array of objects
- `findOne(model, filter)` - Accept model and filtering object, return Promise resolved to object