# 2.0.0

* added providers
* added new interface
```
let cofamo = require('co-famo');
let Factory = new cofamo.Factory();
```
* added mongoose and memory providers
```
let cofamo = require('co-famo');
let MemoryProvider = cofamo.MemoryProvider;
let MongooseProvider = cofamo.MongooseProvider; // set by default
```
* refactored to use `class`


# 1.2.x

* added inheritance to `.object` which support parent object funcitons
* top most function in inheritance chain will be set to resulting object
