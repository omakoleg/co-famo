'use strict';

module.exports = {
    user: function(lib){
        this.name = lib.rndHex(32);
        this.body = lib.rndHex(40);
        this.comments = lib.buildArray('user.comment', 0, 10);
        this.date = Date.now;
        this.hidden = false;
        this.meta = lib.bulid('use.meta');
    },
    'user.comment': function(lib){
        this.body = lib.rndHex(32);
        this.date = lib.rndDate();
    },
    'user.meta': function(lib){
        this.votes = lib.rndNumber();
        this.favs = lib.rndNumber(0, 10);
    }
};
