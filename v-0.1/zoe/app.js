define(function(require, exports, module) {

    var zoe = require('zoe');

    zoe(function() {
        var panel = zoe.find('p1');
        window.panel = panel;
    });
});