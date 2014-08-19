// 地图组件，使用了百度地图api
// by lizzz (http://lizzz0523.github.io/)

define(function(require, exports, module) {

    // 加载对应的css文件
    require('./style.css');


    var // 引入百度地图api
        bmap = require('tool/bmap'),

        Map = bmap.Map,
        Point = bmap.Point,
        Size = bmap.Size,

        Icon = bmap.Icon,
        Marker = bmap.Marker,
        Label = bmap.Label,

        NavigationControl = bmap.NavigationControl,
        MapTypeControl = bmap.MapTypeControl,
        OverviewMapControl = bmap.OverviewMapControl,

        $ = require('jquery'),
        _ = require('underscore'),

        ZView = require('plugin/view/index'),
        ZPanel = require('plugin/panel/index');


    var defaults = {
        'lat'      : 39.943146, // 纬度
        'lng'      : 116.337284, // 经度
        'zoom'     : 13, // 地图缩放级别
        'offset'   : 0.01, // 中心点偏移量

        'nav'      : false, // 是否添加导航控件
        'overview' : false, // 是否添加右下角缩略图
        'icon'     : {
            url    : 'http://img4.bitauto.com/dealer/dealersite/20140626/images/map_i24.png',
            size   : { w: 28, h: 35 },
            anchor : { w: 14, h: 33 },
            events : [
                { 
                    name : 'click',
                    fn : function () { }
                }
            ]
        }, // 自定义标点信息
        'label'    : {
            style    : {
                'border-color' : '#ccc'
            },
            template : _.template([

                '<div class="z_map_label">',
                    '<%= content %>',
                '</div>'

            ].join(''))
        }, // 自定义浮层信息
    };


    var ZSite = ZView.extend({
            ztype : 'map_site',

            terminal : true,

            initialize : function(options) {
                _.extend(this, _.pick(options, ['map', 'lat', 'lng', 'speed']));

                ZView.prototype.initialize.call(this, options);
            },

            show : function(offset, zoom, silent) {
                var map = this.map,
                    lng = this.lng,
                    lat = this.lat + offset,
                    center = new Point(lng, lat),
                    
                    speed = !silent && this.speed;

                ZView.prototype.show.call(this);

                // 如果传入silent参数
                // 则为初始化地图位置
                // 使用map的centerAndZoom接口
                if (!speed) {
                    map.centerAndZoom(center, zoom);
                } else {
                    map.panTo(center);
                }

                return this;
            },
            
            // match方法是用于判断地图当前是否对准某个site
            match : function(offset) {
                var map = this.map,
                    lng = this.lng,
                    lat = this.lat + offset,
                    center = map.getCenter();
                
                return center.lng === lng && center.lat === lat;
            },

            // 初始化标点
            // 具体操作查看百度地图api
            initMarker : function(options) {
                var map = this.map,
                    lng = this.lng,
                    lat = this.lat,
                    center = new Point(lng, lat),

                    iconSize,
                    iconAnchor,
                    iconOffset,
                    icon,
                    marker,
                    i = -1,
                    len;

                if (options) {
                    if (options.url != '') {
                        iconSize = new Size(options.size.w, options.size.h);
                        iconAnchor = new Size(options.anchor.w, options.anchor.h);
                        iconOffset = new Size(0, 0);
                        icon = new Icon(options.url, iconSize, { anchor : iconAnchor, imageOffset : iconOffset });// 设置图片偏移

                        marker = new Marker(center, { icon : icon });
                    } else {
                        marker = new Marker(center);
                    }

                    if (options.events) {
                        len = options.events.length;
                        while (++i < len) {
                            marker.addEventListener(options.events[i].name, options.events[i].fn);
                        }
                    }

                    map.addOverlay(marker);
                }

                this.marker = marker;
            },

            // 初始化浮层信息
            // 具体操作查看百度地图api
            initLabel : function(options) {
                var $elem = this.$el,
                    
                    width = $elem.outerWidth(true),
                    height = $elem.outerHeight(true),

                    map = this.map,
                    lng = this.lng,
                    lat = this.lat,
                    center = new Point(lng, lat),

                    labelContent,
                    labelOffset,
                    label;

                if (options) {
                    if (options.template) {
                        labelContent = options.template({
                            content : $elem.html()
                        });
                    } else {
                        labelContent = $elem.html();
                    }

                    labelOffset = new Size(-width / 2 + 18, -height - 43);
                    label = new Label(labelContent, { offset : labelOffset, position : center});

                    if (options.style) {
                        label.setStyle(options.style);
                    }

                    map.addOverlay(label);
                }

                this.label = label;
            }
        }),

        // 理解ZMap有点困难
        // 这是由于ZSite对象，是要控制另个label的
        // 一个是放在map中，一个是放在asset中
        // map中的label是实际显示的
        // asset中的label只是用于模拟出map中label的宽高，以方便参数的设置
        ZMap = ZPanel.extend({
            ztype : 'map',

            template : _.template([

                '<div class="z_map_mask">',
                    '<div class="z_map_view"></div>',
                    '<div class="z_map_asset"></div>',
                '</div>'

            ].join('')),

            initialize : function(options) {
                _.extend(this, _.pick(options = _.defaults(options, defaults), _.keys(defaults)));

                ZPanel.prototype.initialize.call(this, options);
            },

            reset : function() {
                var $view,
                    $asset,
                    
                    map;

                ZView.prototype.reset.call(this);

                $view = this.$('.z_map_view');
                $asset = this.$('.z_map_asset');

                this.$inner = $asset;
                this.$view = $view;
                this.$asset = $asset;

                map = new Map($view.get(0));
                map.enableScrollWheelZoom();

                this.map = map;

                return this;
            },

            render : function() {
                var $data = this.$data,

                    data = this.data,
                    tmpl = this.tmpl,

                    speed = this.speed,
                    map = this.map,
                    lat = this.lat,
                    lng = this.lng,
                    init = this.init;

                if (data) {
                    data.each(function(model) {
                        var item = new ZSite({
                                zid   : model.id || model.cid,
                                speed : speed,
                                map   : map,
                                lat   : model.get('lat') || lat,
                                lng   : model.get('lng') || lng,

                                data  : model.toJSON(),
                                tmpl  : tmpl
                            });

                        this.append(item.render().el);
                        this.addItem(item);
                    }, this);
                } else {
                    _.each($data, function(elem) {
                        var $elem = $(elem),

                            item = new ZSite({
                                zid   : elem.id || void 0,
                                speed : speed,
                                map   : map,
                                lat   : $elem.data('lat') || lat,
                                lng   : $elem.data('lng') || lng
                            });

                        this.append(item.stack(elem).render().el);
                        this.addItem(item);
                    }, this);

                    // 如果没有任何配置元素
                    // 则尝试使用全局配置参数
                    if (!this.size()) {
                        var item = new ZSite({
                                speed : speed,
                                map   : map,
                                lat   : lat,
                                lng   : lng
                            });

                        this.append(item.render().el);
                        this.addItem(item);
                    }
                }

                this.cache();
                this.start(init);

                return this;
            },

            start : function(init) {
                this.eachItem(function(item) {
                    item.initMarker(this.icon);

                    if (item.$el.html() !== '') {
                        item.initLabel(this.label);
                    }
                });

                if (this.nav) {
                    this.map.addControl(new NavigationControl());
                    this.map.addControl(new MapTypeControl());
                }

                if (this.overview) {
                    this.map.addControl(new OverviewMapControl({
                        anchor : BMAP_ANCHOR_BOTTOM_RIGHT,
                        isOpen : true
                    }));
                }

                // this.clear();
                this.show(init);
            },

            // 采用了overflow为hidden的模式
            // 代替display-none模式
            // clear : function() {
            //     this.$asset.hide();
            // },

            show : function(index) {
                var $elem = this.$el,

                    map = this.map,
                    zoom = this.zoom,
                    offset = this.offset,

                    items = this.items,
                    curIndex = this.curIndex,
                    visible = this.visible;

                if (!visible) {
                    $elem.show();
                }

                if (index != void 0) {
                    index = this.validIndex(index);

                    if (curIndex != index || !items[index].match(offset)) {
                        items[index].show(offset, zoom, curIndex == -1);
                    }
                        
                    if (curIndex != index) {
                        this.updateIndex(index);
                    }
                }

                this.visible = true;

                return this;
            }
        });


    module.exports = ZMap;

});