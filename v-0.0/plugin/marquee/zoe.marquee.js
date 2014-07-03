/*
    by lizzz(https://github.com/lizzz0523)
*/

(function(Z, _, B, window){

var tmpl = [

		'<div class="marquee_view">',
			'<div class="marquee_wraper">',
				'<div class="marquee_shadow"><%= orig.html %></div>',
				'<div class="marquee_shadow"><%= orig.html %></div>',
			'</div>',
		'</div>',

		'<div class="marquee_orig"><%= orig.html %></div>'

	].join(''),

	scroll = function($dom, side, speed, max) {
		side = B.$.camelCase(['scroll', side].join('-'));
		side = B.$.proxy($dom[side], $dom);

		return function() {
			var offset = side();

			offset += speed;
			if (offset >= max) offset = 0;

			side(offset);
		};
	},

	defaults = {
		hover : true,
		auto : true,
		vertical : false,
		speed : 1
	};



var Marquee = Z.View.Marquee = B.View.extend({

	template : _.template(tmpl),

	events : {
		'resize' : 'resize',

		'mouseenter' : 'inactive',
		'mouseleave' : 'active'
	},

	initialize : function(options) {
		this.isAuto = options.isAuto;
		this.isHover = options.isHover;
		this.isVertical = options.isVertical;

		this.started = false;
		this.speed = options.speed;
		this.width = options.width;
		this.height = options.height;

		this.build();
		this.resize();
	},

	resize : function(event) {
		var $view = this.$view,
			$slider = this.$slider,
			$shadow = this.$shadow,
			$orig = this.$orig,

			shadowLength,
			viewLength;

		if (this.isVertical) {
			viewLength = $view.height();
			shadowLength = this.height || $shadow.height();

			$shadow.height(shadowLength);
			$slider.height(2 * shadowLength);
		} else {
			viewLength = $view.width();
			shadowLength = this.width || $shadow.width();

			$shadow.width(shadowLength);
			$slider.width(2 * shadowLength);
		}

		this.scroll = scroll(this.$view, this.isVertical ? 'top' : 'left', this.speed, shadowLength);
		this.scrollable = shadowLength > viewLength;

		this.$view.toggle(this.scrollable);
		this.$orig.toggle(!this.scrollable);
	
		if (this.isAuto && this.scrollable) {
			this.start();
		} else {
			this.stop();
		}
	},

	inactive : function(event) {
		if (this.isHover && this.scrollable) {
			event && event.preventDefault();
			this.stop();
		}
	},

	active : function(event) {
		if (this.isHover && this.scrollable) {
			event && event.preventDefault();
			this.start();
		}
	},

	start : function() {
		if (this.started) return;
		
		Z.Ticker.enter(this.scroll, this);
		this.started = true;
	},

	stop : function() {
		if (!this.started) return
		
		Z.Ticker.leave(this.scroll);
		this.started = false;
	},

	build : function() {
		var orig = {
			html : this.$el.html()
		};

		this.$el.html(this.template({
			orig : orig
		}));

		this.$view = this.$('.marquee_view');
		this.$slider = this.$('.marquee_wraper');
		this.$shadow = this.$('.marquee_shadow');
		this.$orig = this.$('.marquee_orig');

		this.$el.addClass('zoe-marquee');
	}
});

B.$('[zoe^=marquee]').each(function() {
    var $elem = B.$(this),

        opts = $elem.attr('zoe'),
        id = $elem.attr('zoe-id'),

        views = Z.data(window, 'zoe-view');

    opts = Z.parseParam(opts);
    opts = _.defaults(opts, defaults);

    if (!id) {
        id = 'zoe-' + Z.guid();
        $elem.attr('zoe-id', id);
    }

    if (!views) {
        views = {};
    }

    if (!views[id]) {
		views[id] = new Marquee({
	        el         : this,

	        isAuto     : opts.auto,
	        isHover    : opts.hover,
	        isVertical : opts.vertical,
	        speed      : opts.speed,
	        width      : opts.width,
	        height     : opts.height
	    });
	}
});
		
})(Zoe, _, Backbone, this);