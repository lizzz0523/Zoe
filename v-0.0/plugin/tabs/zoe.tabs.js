/*
    by lizzz(https://github.com/lizzz0523)
*/

(function(Z, _, B, window) {

"use strict";

var defaults = {
        hover : false
    },

    getHash = function(link) {
        // 提取href中的hash部分
        // 因为动态生成的anchor标签（通过innerHTML）
        // 其hash属性为空

        var hash = link.href;

        if(hash.indexOf('#') == -1) return '';
        hash = hash.split('#').pop();

        return hash;
    };


var Tabs = Z.View.Tabs = B.View.extend({

    events : {
        'click a' : 'active',
        'mouseenter a' : 'active'
    },

    initialize : function(options) {
        this.target = options.target;
        this.isHover = options.isHover;

        this.build();

        this.cache = (function($hooks) {

            var cache = {};

            $hooks.each(function(i) {
                var hash = getHash(this);
                if (hash) {
                    if( cache[hash] ) {
                        cache[hash].push(this);
                    } else {
                        cache[hash] = $(this);
                    }
                }
            });

            return cache;

        })(this.$hooks);

        this.listenTo(this.target, 'change', _.bind(this.activeTab, this));
    },

    active : function(event) {
        var index = getHash(event.currentTarget),
            cache = this.cache;

        if (!index || !cache[index]) return true;

        this.activeTab(index);

        event && event.preventDefault();
    },

    activeTab : function(index) {
        var prev = this.curIndex,
            cache = this.cache;

        if(index == prev) return;

        if(prev){
            cache[prev].removeClass('active');
        }
        cache[index].addClass('active');
        
        this.curIndex = index;

        this.trigger('active', this.curIndex);
    },

    build : function() {
        this.$hooks = this.$('a');
    }

});


B.$('[zoe^=tabs]').each(function() {

    var $elem = B.$(this),

        opts = $elem.attr('zoe'),
        tid = $elem.attr('zoe-for'),
        id = $elem.attr('zoe-id'),

        views = Z.data(window, 'zoe-view');

    opts = Z.parseParam(opts);
    opts = _.defaults(opts, defaults);

    if (!tid) throw Error('Target Not Found');

    if (!id) {
        id = 'zoe-view-' + Z.guid();
        $elem.attr('zoe-id', id);
    }

    if (!views) {
        views = {};
    }

    if (!views[tid]) {
        opts.target = {};
    } else {
        opts.target = views[tid];
    }

    if (!views[id]) {
        views[id] = new Tabs({
            el : this,

            target : opts.target,
            isHover : opts.hover
        });
    }

    Z.data(window, 'zoe-view', views);
});

})(Zoe, _, Backbone, this);