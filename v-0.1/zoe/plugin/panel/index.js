define(function(require, exports, module) {

    var queue = require('tool/queue'),

        $ = require('jquery'),
        _ = require('underscore'),

        View = require('backbone').View;


    var defaults = {
            'speed'   : 200,
            'current' : 0
        };


    var PanelItem = View.extend({
            tagName : 'div',

            className : 'z_panel_item',

            initialize : function(options) {
                this.itemId = options.itemId;
                this.speed = options.speed;
            },

            show : function(silent) {
                if (silent) {
                    this.$el.show();
                } else {
                    this.$el.fadeIn(this.speed);
                }
            },

            hide : function() {
                this.$el.hide();
            }
        }),

        Panel = View.extend({
            template : [

                '<div class="z_panel_view"></div>',

            ].join(''),
            
            initialize : function(options) {
                this.options = _.defaults(options, defaults);

                // 这里的队列是用于处理效果的触发
                // 以免出现漏帧
                this.queue = queue(this);
                this.visible = true;
                this.items = [];
                this.controls = [];

                this.render();

                // 重组整个控件的dom结构
                if (this.options.remote && !_.isArray(this.options.remote)) {
                    this.listenTo(this.options.remote, 'reset', this.reset);
                } else {
                    this.reset();
                }
            },

            render : function() {
                var $elem = this.$el,
                    $items = $elem.children(),
                    
                    $view;

                // 从dom中取出原有内容
                $items.detach();

                // 重新写入dom结构
                $elem.html(this.template);
                $elem.addClass('z_panel');

                // 提取dom结构
                $view = this.$('.z_panel_view');

                this.$items = $items;
                this.$inner = $view;

                this.$view = $view;
            },

            reset : function() {
                var $items = this.$items,

                    items = this.items,

                    options = this.options,
                    speed = options.speed,
                    current = options.current,
                    remote = options.remote,
                    template = options.template;

                if (remote && template && _.isFunction(template)) {
                    // 如果数据来源外部
                    // 则需要根据模板重新渲染
                    // 如果数据来源外部
                    // 则需要根据模板重新渲染
                    if (_.isArray(remove)) {
                        _.each(remote, function(data) {
                            var itemId = data.id || void 0,
                                item;

                            item = new SliderItem({
                                itemId : itemId,
                                speed : speed
                            });
                            item.$el.html(template(data));

                            this.addItem(item);
                        })
                    } else {
                        remote.each(function(model) {
                            var itemId = model.id || model.cid,
                                item;

                            item = new SliderItem({
                                itemId : itemId,
                                speed : speed
                            });
                            item.$el.html(template(model.toJSON()));

                            this.addItem(item);
                        }, this);
                    }
                } else {
                    _.each($items, function(elem) {
                        var itemId = elem.id || void 0,
                            item;

                        item = new PanelItem({
                            itemId : itemId,
                            speed : speed
                        });
                        item.$el.html(elem);

                        this.addItem(item);
                    }, this);
                }

                this.cache();
                this.show(current);
            },

            cache : function() {
                var items = this.items,
                    cache = {};

                _.each(items, function(item, index) {
                    var itemId = item.itemId;

                    if (itemId != void 0) {
                        cache[itemId] = index;
                    }
                });

                this.id2Index = cache;
                this.minIndex = 0;
                this.maxIndex = items.length - 1;
                this.curIndex = -1;
            },

            validIndex : function(index) {
                var minIndex = this.minIndex,
                    maxIndex = this.maxIndex;

                if (_.isString(index)) {
                    index = this.id2Index[index];
                }

                if (_.isFinite(index)) {
                    index = +index;

                    if (index > maxIndex) {
                        index = maxIndex;
                    }

                    if (index < minIndex) {
                        index = minIndex;
                    }
                } else {
                    index = minIndex;
                }

                return index;
            },

            updateIndex : function(index) {
                this.curIndex = index;
                this.trigger('update', this.curIndex);
            },

            show : function(index) {
                var items = this.items,
                    curIndex = this.curIndex;

                if (!this.visible) {
                    this.$el.show();
                    this.visible = true;

                    if (curIndex != -1) {
                        items[curIndex].show(true);
                    }
                }

                if (index == void 0) return;

                index = this.validIndex(index);
                if (curIndex == index) return;
                
                if (curIndex == -1) {
                    // curIndex == -1
                    // 说明控件仍未初始化
                    _.each(items, function(item) {
                        item.hide();
                    });
                    items[index].show(true);
                } else {
                    items[curIndex].hide();
                    items[index].show();
                }

                this.updateIndex(index);
            },

            hide : function() {
                var items = this.items,
                    curIndex = this.curIndex;

                if (this.visible) {
                    this.$el.hide();
                    this.visible = false;

                    if (curIndex != -1) {
                        items[curIndex].hide();
                    }
                }
            },

            size : function() {
                return this.items.length;
            },

            addItem : function(item) {
                var $elem = this.$inner || this.$el,
                    items = this.items;

                $elem.append(item.$el);
                items.push(item);
            },

            addControl : function(control, append) {
                var $elem =  this.$el,
                    controls = this.controls;

                if (append) {
                    $elem.append(control.$el);
                }
                controls.push(control);

                this.listenTo(control, 'update', this.show);
            }
            
        });


    module.exports = Panel;

});