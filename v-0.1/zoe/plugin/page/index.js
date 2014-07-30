// 翻页组件
// by lizzz (http://lizzz0523.github.io/)

define(function(require, exports, module) {

    var utils = require('tool/utils'),

        $ = require('jquery'),
        _ = require('underscore'),

        ZView = require('plugin/view/index');


    var defaults = {
            'tmpl'    : _.template('<a href="#page/<%= index %>"><%= index + 1 %></a>'),
            'pattern' : /^page\/([\d\w][\d\w\s]*)$/,
            'total'   : 0,
            'init'    : 0
        };


    var ZPage = ZView.extend({
            terminal : true,

            events : {
                'click a' : 'clickPage'
            },

            initialize : function(options) {
                _.extend(this, _.pick(options = _.defaults(options, defaults), _.keys(defaults)));

                ZView.prototype.initialize.call(this, options);
            },

            reset : function() {
                var $elem = this.$el,
                    $data = $elem.children();

                $data.detach();

                $elem.html(this.template({}));
                $elem.addClass('z_page');

                this.$data = $data;
                this.$inner = $elem;

                return this;
            },

            render : function() {
                var $data = this.$data,

                    data = this.data,
                    tmpl = this.tmpl,

                    i = -1,
                    len,

                    init = this.init;

                if (data) {
                    len = data.length;
                } else {
                    len = this.total;
                }

                while (++i < len) {
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
                    href = target.getAttribute('href', 2),
                    hash;

                event && event.preventDefault();

                if (hash = this.getHash(href)) {
                    this.active(hash);
                }
            },

            getHash : function(url) {
                var pattern = this.pattern,
                    hash = utils.parseURL(url).hash;

                if (pattern && (hash = hash.match(pattern))) {
                    hash = hash.pop();
                }

                return hash;
            }
        });


    module.exports = ZPage;

});