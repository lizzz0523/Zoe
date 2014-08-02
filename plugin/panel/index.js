// Panel组件，属于MultiView组件，是其他MultiView组件的基类
// 主要用于与Menu产生联动，形成Tab-Panel效果
// by lizzz (http://lizzz0523.github.io/)

define(function(require, exports, module) {

    var $ = require('jquery'),
        _ = require('underscore'),

        ZView = require('plugin/view/index');


    var defaults = {
            'speed' : 200,
            'init'  : 0
        };


    var ZBlock = ZView.extend({
            terminal : true,

            initialize : function(options) {
                _.extend(this, _.pick(options, ['speed']));

                ZView.prototype.initialize.call(this, options);
            },

            reset : function() {
                var $elem = this.$el,
                    $data = $elem.children();

                $data.detach();

                $elem.html(this.template({}));
                $elem.addClass('z_panel_block');

                this.$data = $data;
                this.$inner = $elem;

                return this;
            },

            show : function(slient) {
                var $elem = this.$el,

                    visible = this.visible,
                    speed = !slient && this.speed;

                if (!visible) {
                    if (!speed) {
                        this.$el.show();
                    } else {
                        this.$el.fadeIn(speed);
                    }
                }

                this.visible = true;

                return this;
            }
        }),

        ZPanel = ZView.extend({
            template : [

                '<div class="z_panel_view"></div>',

            ].join(''),
            
            initialize : function(options) {
                _.extend(this, _.pick(options = _.defaults(options, defaults), _.keys(defaults)));

                ZView.prototype.initialize.call(this, options);
            },

            reset : function() {
                var $elem = this.$el,
                    $data = $elem.children(),
                    
                    $view;

                $data.detach();

                $elem.html(this.template);
                $elem.addClass('z_panel');

                $view = this.$('.z_panel_view');

                this.$data = $data;
                this.$inner = $view;

                this.$view = $view;

                return this;
            },

            render : function() {
                var $data = this.$data,

                    data = this.data,
                    tmpl = this.tmpl,

                    speed = this.speed,
                    init = this.init;

                if (data) {
                    data.each(function(model) {
                        var item = new ZBlock({
                                zid   : model.id || model.cid,
                                speed : speed,

                                data  : model.toJSON(),
                                tmpl  : tmpl
                            });

                        this.append(item.render().el);
                        this.addItem(item);
                    }, this);
                } else {
                    _.each($data, function(elem) {
                        var item = new ZBlock({
                                zid   : elem.id || void 0,
                                speed : speed
                            });

                        this.append(item.stack(elem).render().el);
                        this.addItem(item);
                    }, this);
                }

                this.cache();
                this.show(init);

                return this;
            },

            cache : function() {
                var cache = {};

                this.eachItem(function(item, index) {
                    var id = item.zid;

                    if (id != void 0) {
                        cache[id] = index;
                    }
                });

                this.id2Index = cache;
                this.minIndex = 0;
                this.maxIndex = this.size() - 1;
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
                var $elem = this.$el,

                    items = this.items,
                    curIndex = this.curIndex,
                    
                    visible = this.visible;

                if (!visible) {
                    $elem.show();
                }

                // 根据给出的index进行显示
                if (index != void 0) {
                    index = this.validIndex(index);
                    
                    if (curIndex != index) {
                        if (curIndex == -1) {
                            // curIndex == -1
                            // 说明控件仍未初始化
                            _.invoke(items, 'hide');
                            items[index].show(true);
                        } else {
                            items[curIndex].hide();
                            items[index].show();
                        }

                        this.updateIndex(index);
                    }
                }

                this.visible = true;

                return this;
            },

            size : function() {
                return this.items ? this.items.length : 0;
            },

            current : function() {
                return this.curIndex;
            },

            addControl : function(control) {
                var controls = this.controls || (this.controls = []);

                controls.push(control);
                this.binding(control);

                return this;
            }
        });


    module.exports = ZPanel;

});