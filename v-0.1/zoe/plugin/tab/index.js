define(function(require, exports, module) {

    var $ = require('jquery'),
        _ = require('underscore'),

        B = require('backbone'),
        
        utils = require('tool/utils');


    var Tab = B.View.extend({

            events : {
                'click a' : 'clickTab'
            },

            initialize : function() {
                this.$tabs = this.$('a');

                this.curTab = false;

                this.tab2Index = (function($tabs) {

                    var tab2Index = {};

                    $tabs.each(function(index) {
                        var hash = utils.parseHash(this.href),
                            tab;

                        if (hash = hash.match(/^tab:([\d\w][\d\w\s]*)$/)) {
                            tab = hash[1];

                            if (!tab2Index[tab]) {
                                tab2Index[tab] = [];
                            }

                            tab2Index[tab].push(index);
                            tab2Index[index] = tab;
                        }
                    });

                    return tab2Index;

                })(this.$tabs);

                this.reset(options.current);
            },

            reset : function(initTab) {
                this.tabTo(this.validTab(initTab || this.tab2Index[0]));
            },

            tabTo : function(tab) {
                var $tabs = this.$tabs,

                    tab2Index = this.tab2Index,
                    prevTab = this.curTab;

                if (prevTab == tab) return;

                $tabs.removeClass('active');
                _.each(tab2Index[tab], function(index) {
                    $tabs.eq(index).addClass('active');
                });

                this.curTab = tab;
                this.trigger('update', this.curTab);
            },

            validTab : function(tab) {
                var tab2Index = this.tab2Index;

                if (!tab2Index[tab]) {
                    tab = tab2Index[0];
                }

                return tab;
            },

            goto : function(tab) {
                tab = this.validTab(tab);
                this.tabTo(tab);
            },

            size : function() {
                return this.$tabs.length;
            },

            show : function() {
                this.$el.show();
            },

            hide : function() {
                this.$el.hide();
            },

            clickTab : function(event) {
                var target = event.currentTarget,
                    hash = utils.parseHash(target.href);

                event && event.preventDefault();

                if (hash = hash.match(/^tab:([\d\w][\d\w\s]*)$/)) {
                    this.goto(hash[1]);
                }
            }
            
        });


    module.exports = Tab;

});