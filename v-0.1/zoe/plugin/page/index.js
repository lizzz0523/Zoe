
// 翻页组件
// by lizzz (http://lizzz0523.github.io/)

define(function(require, exports, module) {

    var utils = require('tool/utils'),

        $ = require('jquery'),
        _ = require('underscore'),

        ZView = require('plugin/view/index');


    var defaults = {
            'pattern' : /^page\/([\d\w][\d\w\s]*)$/,
            'total'   : 0,
            'init'    : 0
        };


    var ZPage = ZView.extend({
            terminal : true,

            tmpl : _.template([

                '<a href="#page/<%= index %>"><%= index + 1 %></a>',

            ].join('')),

            events : {
                'click a' : 'clickPage'
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
                $elem.addClass('z_page');

                this.$items = $items;
                this.$inner = $elem;

                return this;
            },

            render : function() {
                var tmpl = this.tmpl,
                    i = -1,
                    total = this.collection.length,
                    init = this.init;

                while(++i < total) {
                    this.append(tmpl({
                        index : i
                    }));
                }

                this.cache();
                this.active(init);

                return this;
            },

            build : function() {
                var tmpl = this.tmpl,
                    i = -1,
                    total = this.total,
                    init = this.init;

                while(++i < total) {
                    this.append(tmpl({
                        index : i
                    }));
                }

                this.cache();
                this.active(init);

                return this;
            },

            cache : function() {
                this.minPage = 0;
                this.maxPage = this.size() - 1;
                this.curPage = -1;
            },

            validPage : function(page) {
                var minPage = this.minPage;
                    maxPage = this.maxPage;

                if (_.isFinite(page)) {
                    page = +page;

                    if (page > maxPage) {
                        page = maxPage;
                    }

                    if (page < minPage) {
                        page = minPage;
                    }
                } else {
                    page = minPage;
                }

                return page;
            },

            active : function(page) {
                var $pages = this.$('a'),
                    curPage = this.curPage;

                page = this.validPage(page);
                if (curPage == page) return;

                $pages.removeClass('active');
                $pages.eq(page).addClass('active');

                this.curPage = page;
                this.trigger('update', this.curPage);
            },

            size : function() {
                return this.$('a').length;
            },

            current : function() {
                return this.curPage;
            },

            clickPage : function(event) {
                var target = event.currentTarget,
                    hash = target.getAttribute('href', 2),

                    pattern = this.pattern;

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


    module.exports = ZPage;

});