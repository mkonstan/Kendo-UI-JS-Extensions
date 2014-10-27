(function (f, define) {
    define(["kendo"], f);
})(function () {

    (function ($, undefined) {

    	var kendo = window.kendo,
            stringify = JSON.stringify,
    		ObservableObject = kendo.data.ObservableObject,
    		ObservableArray = kendo.data.ObservableArray,
            Model = kendo.data.Model;


    	if (!String.prototype.parseDate) {
    		String.prototype.parseDate = function (format, culture) {
    			return kendo.parseDate(this, format, culture);
    		};
    	}

    	if (!Array.prototype.toDataSource) {
    		Array.prototype.toDataSource = function () {
    			return kendo.data.DataSource({ data: this });
    		};
    	}

        kendo.Class.prototype.stringify = function () {
            return stringify(this.toJSON());
        };

        kendo.map = kendo.map || function(array, callback) {
            var idx = 0,
                result = [],
                length = array.length;

            for (; idx < length; idx++) {
                result[idx] = callback(array[idx], idx, array);
            }

            return result;
        };

        ObservableObject.prototype.root = function () {
            var o = this;
            var temp;
            while(true) {
                if(!o.parent) {
                    return null;
                }
                if(!(temp = o.parent())) {
                    break;
                }
                o = temp;
            }
            return o;
        }

        kendo.observableArray = function (array) {
            return new kendo.data.ObservableArray(array);
        };

        kendo.loadTemplate = (function ( jq ) {
            var _templates = [];
            return function (id, html) {
                if (!_templates[id]) {
                    _templates[id] = jq("body").append(html);
                }
            }
        })( $ );

        ObservableObject.prototype.debug = function (id) {
        	var that = this;
        	var uid = id || ("__D" + that.uid + "D__");
        	var out = $(uid);
        	if (out.length === 0) {
        		out = $("<div id=" + uid + "></div>").appendTo("body");
	        }
        	that.bind("change", function (e) {
        		out.text(kendo.stringify(that));
        	});
        	out.text(kendo.stringify(that));
        	return that;
	    };

        ObservableObject.prototype.on = (function () {
        	var _events = [];
        	var eventBindings = [];
        	var getBindingName = function (field, eventName) {
        		return field + "." + eventName;
        	};
        	return function (eventName, fields, handlers) {
        		var that = this;
        		($.isArray(fields) ? fields : [fields]).forEach(function (field) {
        			var boundField = getBindingName(field, eventName);
        			that.bind(boundField, handlers);
        			eventBindings[boundField] = true;
        		});

        		var evid = getBindingName(this.uid, eventName);
        		if (!_events[evid]) {
        			that.bind(eventName, function (e) {
        				var name = getBindingName(e.field, eventName);
        				if (eventBindings[name]) {
        					this.trigger(name, e);
        				}
        			});
        			_events[evid] = true;
        		}
        	};
        })();

        kendo.observableFactory = function (builder, debug) {
        	var o = kendo.observable({});
        	builder.call(o, o);
        	if (debug) o.debug();
            return o;
        };

        kendo.htmlForId = function(id) {
        	return $((id.slice(0, 1) === "#") ? id : "#" + id).html();
        }

        kendo.defineModel = (function () {
        	var _define = Model.define;
        	var _init = Model.fn.init;
        	return function (model) {
        		model = model || {};
        		// save init if we defined it
        		var init = model.init;
        		var parse = model.parse;
        		// override defined init with our own
        		model.init = function (data) {
        			var that = this;
        			if (parse && data) {
        				data = parse.call(this, data);
        			}
        			_init.call(that, data);
        			if (init && $.isFunction(init)) {
        				init.call(that, data);
        				if (that.dirty) that.dirty = false;
        			}
        		};
        		return _define(model);
        	};
        })();

        kendo.defineObservable = (function () {
        	return function (base) {
        		var base = base || {};
        		var init = base.init;
        		var proto = {
        			init: function (data) {
        				var that = this;
        				data = (!data || $.isEmptyObject(data)) ? $.extend({}, base) : $.extend({}, base, data);
        				ObservableObject.fn.init.call(that, data);
        				if (init && $.isFunction(init)) {
        					init.call(that, data);
        				}
        			}
        		};
        		return ObservableObject.extend(proto);
        	};
        })();

    })(window.kendo.jQuery);

    return window.kendo;
}, typeof define == 'function' && define.amd ? define : function (_, f) { f(); });
