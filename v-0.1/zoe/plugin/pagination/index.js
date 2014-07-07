define(function(require, exports, module) {

    var $ = require('jquery'),
        _ = require('underscore'),

        B = require('backbone'),
        
        utils = require('tool/utils');


    var Pagination = B.View.extend({

            tagName : 'div',

            template : _.template([

                '<% for (var i = 0; i < total; i++) { %>',
                    '<a href="#page:<%= i %>"><%= i + 1 %></a>',
                '<% } %>'

            ].join('')),

            events : {
                'click a' : 'clickPage'
            },

            initialize : function(options) {
                this.render(options.total);
                
                this.$pages = this.$('a');

                this.totalPage = this.size() - 1;
                this.curPage = -1;

                this.page2Index = (function($pages) {

                    var page2Index = {};

                    $pages.each(function(index) {
                        var hash = utils.parseHash(this.href),
                            page;

                        if (hash = hash.match(/^page:([\d\w][\d\w\s]*)$/)) {
                            page = hash[1];
                            page2Index[page] = index;
                        }
                    });

                    return page2Index;

                })(this.$pages);

                this.reset(options.current);
            },

            render : function(total) {
                var $elem = this.$el;

                $elem.html(this.template({
                    total : total
                }));
                $elem.addClass('z_pagination');

                return this;
            },

            reset : function(initPage) {
                this.pageTo(this.validPage(initPage || 0));
            },

            pageTo : function(page) {
                var $pages = this.$pages,

                    page2Index = this.page2Index,
                    prevPage = this.curPage;

                if (this.curPage == page) return;

                $pages.removeClass('active');
                $pages.eq(page2Index[page]).addClass('active');

                this.curPage = page;
                this.trigger('update', this.curPage);
            },

            validPage : function(page) {
                var minPage = 0;
                    maxPage = this.totalPage;

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

            goto : function(page) {
                page = this.validPage(page);
                this.pageTo(page);
            },

            size : function() {
                return this.$pages.length;
            },

            show : function() {
                this.$el.show();
            },

            hide : function() {
                this.$el.hide();
            },

            clickPage : function(event) {
                var target = event.currentTarget,
                    hash = utils.parseHash(target.href);

                event && event.preventDefault();

                if (hash = hash.match(/^page:([\d\w][\d\w\s]*)$/)) {
                    this.goto(hash[1]);
                }
            }
            
        });


    module.exports = Pagination;

});