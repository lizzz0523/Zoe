define(function(require, exports, module) {

    window.zoe = require('zoe');
    window.zclient = require('tool/client');
    window.zevent = require('tool/event');
    window.zqueue = require('tool/queue');
    window.zstate = require('tool/state');
    window.zstyle = require('tool/style');


    var elem;

    if (elem = document.getElementById('flip-block')) {
        zoe.use('game/flip-block', function(Game) {
            var game = new Game({
                    el    : elem,
                    row   : 3,
                    col   : 3,
                    gap   : 10,
                    front : 'images/flip-block/front_game.jpg',
                    back  : 'images/flip-block/back_game.jpg'
                });

            game.render([0, 4, 1, 5, 6, 8, 2, 7, 3]);

            setTimeout(function() {
                game.start();
            }, 1000);
        });
    }
    
});