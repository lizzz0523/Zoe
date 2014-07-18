// 导航组件，可以用作Tab，Menu，Nav等
// by lizzz (http://lizzz0523.github.io/)

define(function(require, exports, module) {

    var utils = require('tool/utils'),

        $ = require('jquery'),
        _ = require('underscore'),

        ZView = require('plugin/view/index');


    var defaults = {
            'pattern' : false,       
            'repeat'  : false, //重复标志，由于现实按钮能否重复点击
            'init'    : ''
        };


    var ZMenu = ZView.extend({
            terminal : true,

            tmpl : _.template([

                '<a href="#<%= target %>"><%= text %></a>'

            ].join('')),

            events : {
                'click a' : 'clickTab'
            },

            initialize : function(options) {
                _.extend(this, _.pick(options = _.defaults(options, defaults), _.keys(defaults)));

                ZView.prototype.initialize.call(this, options);
            },

            reset : function() {
                var $elem = this.$el,
                    $items = $elem.children();

                $items.detach();

                $elem.html(this.template({}));
                $elem.addClass('z_menu');

                this.$items = $items;
                this.$inner = $elem;

                return this;
            },

            render : function() {
                var collection = this.collection,

                    tmpl = this.tmpl,
                    init = this.init;

                this.collection.each(function(model) {
                    this.append(tmpl(model.toJSON()));
                }, this);

                this.cache()
                this.active(init);

                return this;
            },

            build : function() {
                var $items = this.$items,

                    init = this.init;

                _.each($items, function(elem) {
                    this.append(elem);
                }, this);

                this.cache()
                this.active(init);

                return this;
            },

            cache : function() {
                var $elem = this.$el,
                    $tabs = $elem.find('a'),

                    cache = {};

                _.each($tabs, function(tab) {
                    var hash = tab.getAttribute('href', 2);

                    if (hash = this.parseHash(hash)) {
                        if (cache[hash]) {
                            cache[hash].push(tab);
                        } else {
                            cache[hash] = [tab];
                        }
                    }
                }, this);

                this.tab2Elem = cache;
            },

            active : function(tab) {
                var tab2Elem = this.tab2Elem,
                    curTab = this.curTab,

                    repeat = this.repeat;

                if (!tab2Elem[tab] || !repeat && tab == curTab) return;

                _.each(tab2Elem, function(elem, key) {
                    $(elem).toggleClass('active', tab == key);
                }, this);

                this.curTab = tab;
                this.trigger('update', this.curTab);
            },

            current : function() {
                return this.curTab;
            },

            clickTab : function(event) {
                var target = event.currentTarget,
                    hash = target.getAttribute('href', 2);

                event && event.preventDefault();

                if (hash = this.parseHash(hash)) {
                    this.active(hash);
                }
            },

            parseHash : function(hash) {
                var pattern = this.pattern;

                hash = utils.parseHash(hash);
                if (pattern && (hash = hash.match(pattern))) {
                    hash = hash.pop();
                }

                return hash;
            }
        });


    module.exports = ZMenu;

});