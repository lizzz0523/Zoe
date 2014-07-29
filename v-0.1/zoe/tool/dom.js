define(function(require, exports, module) {

var cache = require('tool/cache'),
	event = require('tool/event'),
	queue = require('tool/queue'),
	_ = require('underscore');


function Dom(nodes) {
	nodes = [].slice.call(nodes);
	
	_.each(nodes, function(node, index) {
		this[index] = node;
	});

	return this;
}

Dom.create = function(nodes) {
	return new Dom(nodes);
};

Dom.prototype = {
	version : 'zoe-dom 0.0.1',

	each : function() {

	},

	extend : function() {

	}
};

// mimic EventTarget
_.extend(Dom.prototype, {
	on : function() {

	},

	off : function() {

	},

	one : function() {

	},

	emit : function() {
		
	}
});

// mimic Node
_.extend(Dom.prototype, {
	append : function() {

	},

	prepend : function() {

	},

	before : function() {

	},

	after : function() {

	},

	remove : function() {

	},

	empty : function() {

	},

	clone : function() {

	}
});

_.extend(Dom.prototype, {
	parent : function() {

	},

	children : function() {

	},

	first : function() {

	},

	last : function() {

	},

	siblings : function() {

	},

	next : function() {

	},

	prev : function() {

	},

	find : function() {

	}
});

_.extend(Dom.prototype, {
	eq : function() {

	},

	filter : function() {

	},

	without : function() {

	}
})

_.extend(Dom.prototype, {
	html : function() {

	},

	text : function() {

	},

	val : function() {

	},

	attr : function() {

	},

	prop : function() {

	},

	data : function() {

	}
});

_.extend(Dom.prototype, {
	addClass : function() {

	},

	removeClass : function() {

	},

	toggleClass : function() {

	}
});


module.exports = Dom.create;

});