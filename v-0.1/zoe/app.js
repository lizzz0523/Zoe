define(function(require, exports, module) {

    var zoe = require('zoe');

    zoe(function() {
        var view1 = zoe.find('v1');
        window.view1 = view1;

        var view2 = zoe.find('v2');
        window.view2 = view2;

        if (view1 && view2) {
            view1.addControl(view2);
        }
    });
});