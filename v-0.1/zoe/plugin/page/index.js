// 翻页组件
// by lizzz (http://lizzz0523.github.io/)

define(function(require, exports, module) {

    var utils = require('tool/utils'),

        $ = require('jquery'),
        _ = require('underscore'),

        View = require('backbone').View;


    var defaults = {
            'current'  : 0,
            'total'    : 0,

            'pattern'  : /^page:([\d\w][\d\w\s]*)$/,
            'template' : _.template([

                '<% for (var i = 0; i < total; i++) { %>',
                    '<a href="#page:<%= i %>"><%= i + 1 %></a>',
                '<% } %>'

            ].join(''))
        };


    var Pagination = View.extend({
            events : {
                'click a' : 'clickPage'
            },

            initialize : function(options) {
                this.options = _.defaults(options, defaults);

                this.render();
                this.reset();
            },

            render : function(total) {
                var $elem = this.$el,
                    $pages,

                    options = this.options,
                    template = options.template,
                    total = options.total;

                $elem.html(template({
                    total : total
                }));
                $elem.addClass('z_page');

                $pages = this.$('a');

                this.$pages = $pages;
            },

            reset : function() {
                var options = this.options,
                    current = options.current;

                this.cache();
                this.active(current);
            },

            cache : function() {
                var $pages = this.$pages;

                this.minPage = 0;
                this.maxPage = $pages.length - 1;
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
                var $pages = this.$pages,
                    curPage = this.curPage;

                page = this.validPage(page);
                if (curPage == page) return;

                $pages.removeClass('active');
                $pages.eq(page).addClass('active');

                this.curPage = page;
                this.trigger('update', this.curPage);
            },

            show : function() {
                this.$el.show();
            },

            hide : function() {
                this.$el.hide();
            },

            total : function() {
                return this.$pages.length;
            },

            current : function() {
                return this.curPage;
            },

            clickPage : function(event) {
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


    module.exports = Pagination;

});