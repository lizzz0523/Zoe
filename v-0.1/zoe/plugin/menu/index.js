define(function(require, exports, module) {

    var utils = require('tool/utils'),

        $ = require('jquery'),
        _ = require('underscore'),

        View = require('backbone').View;


    var defaults = {
            'repeat'   : false,
            'pattern'  : /^tab:([\d\w][\d\w\s\-]*)$/,
            'template' : _.template([

                '<a href="#tab:<%= target %>"><%= text %></a>'

            ].join(''))
        };


    var Menu = View.extend({

            events : {
                'click a' : 'clickTab'
            },

            initialize : function(options) {
                this.options = _.defaults(options, defaults);

                this.render();

                if (this.options.remote && !_.isArray(this.options.remote)) {
                    this.listenTo(this.options.remote, 'reset', this.reset);
                } else {
                    this.reset();
                }
            },

            render : function() {
                var $elem = this.$el,
                    $items = $elem.children();

                $items.detach();
                $elem.addClass('z_menu');

                this.$items = $items;
            },

            reset : function() {
                var $elem = this.$el,
                    $items = this.$items,

                    options = this.options,
                    current = options.current,
                    remote = options.remote,
                    template = options.template;

                if (remote && template && _.isFunction(template)) {
                    if (_.isArray(remote)) {
                        _.each(remote, function(data) {
                            $elem.append(template(data));
                        });
                    } else {
                        remote.each(function(model) {
                            $elem.append(template(model.toJSON()));
                        });
                    }
                } else {
                    _.each($items, function(elem) {
                        var $elem = $(elem);
                            $tab = elem.nodeName.match(/a/i) ? $elem : $elem.find('a');

                        $tab.each(function() {
                            var hash = utils.parseHash(this.href);

                            if (hash.length) {
                                hash = 'tab:' + hash;
                                this.setAttribute('href', '#' + hash);
                            }
                        });
                    });

                    $elem.html($items);
                }

                this.cache();
                this.active(current);
            },

            cache : function() {
                var $elem = this.$el,
                    $tabs = $elem.find('a'),

                    options = this.options,
                    pattern = options.pattern,
                    cache = {};

                _.each($tabs, function(tab) {
                    var hash = tab.getAttribute('href', 2);
                    
                    hash = utils.parseHash(hash);
                    hash = hash.match(pattern);

                    if (hash && (hash = hash.pop())) {
                        if (cache[hash]) {
                            cache[hash].push(tab);
                        } else {
                            cache[hash] = [tab];
                        }
                    }
                });

                this.tab2Elem = cache;
            },

            active : function(tab) {
                var options = this.options,
                    repeat = options.repeat,

                    tab2Elem = this.tab2Elem,
                    curTab = this.curTab;

                if (!tab2Elem[tab] || !repeat && tab == curTab) return;

                _.each(tab2Elem, function(elem, key) {
                    $(elem).toggleClass('active', tab == key);
                });

                this.curTab = tab;
                this.trigger('update', this.curTab);
            },

            show : function() {
                this.$el.show();
            },

            hide : function() {
                this.$el.hide();
            },

            current : function() {
                return this.curTab;
            },

            clickTab : function(event) {
                var options = this.options,
                    pattern = options.pattern,

                    target = event.currentTarget,
                    hash = target.getAttribute('href', 2);

                event && event.preventDefault();

                hash = utils.parseHash(hash);
                hash = hash.match(pattern);

                if (hash && (hash = hash.pop())) {
                    this.active(hash);
                }
            }
            
        });


    module.exports = Menu;

});