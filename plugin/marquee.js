/*! Copyright (c) 2013 Liz Chow (http://www.liz-zero.org)
 * Licensed under the MIT License (LICENSE.txt).
 *
 *
 * Version: 1.0.0
 * 
 * Requires: jQuery 1.7.2+
 */
define(function(require, exports, module) {

var event = require('tool/event');


module.exports = function($) {

	var htmlTmpl = [
			'<ul class="marquee-wrap">',
				'<li class="marquee-item">{orig}</li>',
				'<li class="marquee-item">{orig}</li>',
			'</ul>'
		].join('');

	
	function Marquee($el, options){
		this.options = options;

		this.event = event(this);
		this.started = false;
	
		this.$marquee = $el;
		this.orig = $.trim(this.$marquee.html());
		this.html = htmlTmpl.replace(/{orig}/g, this.orig);
		
		var $wraper = $(this.html).prependTo(this.$marquee.empty()),
			innerHeight  = $wraper.find('li.marquee-item').height(),
			outerHeight = options.height || (options.height = innerHeight);
		
		if(innerHeight <= outerHeight){
			this.$marquee.html(this.orig);
			return;
		}
		
		this.$marquee.css({
			height:outerHeight,
			overflow:'hidden'
		});
		
		this.bind();
		
		var self = this;
		
		this.scroll = function(){
			var top = self.$marquee.scrollTop(),
				speed = self.options.speed;
			
			top += speed;
			if(top >= innerHeight) top = 0;

			self.$marquee.scrollTop(top);
		}
		
		if(options.autoPlay){
			this.start();
		}
	}
	
	Marquee.prototype = {
		start : function(){
			if(this.started) return;
			
			event.on('tick', this.scroll);
			this.started = true;
		},
		
		stop : function(){
			if(!this.started) return
			
			event.off('tick', this.scroll);
			this.started = false;
		},
		
		bind : function(){
			if(!this.options.hover) return;
			
			this.$marquee
			.on('mouseenter.marquee', $.proxy(this.stop, this))
			.on('mouseleave.marquee', $.proxy(this.start, this));
		},
		
		unbind : function(){
			this.$marquee.off('.marquee');
		},
		
		reset : function(){
			this.unbind();
			this.stop();
			
			this.$marquee.html(this.orig);
			this.$marquee.removeAttr('style');
			this.$marquee.scrollTop(0);
		}
		
	}
		
	$.fn.marquee = function(options){
		if($.type(options) == 'string'){
			var marquee = this.data('marquee');
			if(!marquee) return;
			
			marquee[options] && marquee[options]();
			
			if(options == 'reset'){
				this.removeData('marquee');
			}
			
			return this;
		}
	
		options = $.extend({
			speed : 1,
			autoPlay : true,
			hover : true
		}, options || {});
		
		return this.each(function(){
			var $el = $(this);
			$el.data('marquee', new Marquee($el, options));
		});
	}	
};

});