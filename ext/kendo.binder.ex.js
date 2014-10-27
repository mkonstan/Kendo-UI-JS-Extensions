(function (f, define) {
    define(["kendo"], f);
})(function () {

	(function ($, undefined) {

		var kendo = window.kendo,
			binders = kendo.data.binders,
			Binder = kendo.data.Binder,
			toString = kendo.toString;

		var parsers = {
			"number": function (value, formats, culture) {
				return kendo.parseFloat(value, formats, culture);
			},

			"date": function (value, formats, culture) {
				return kendo.parseDate(value, formats, culture);
			},

			"boolean": function (value) {
				if (typeof value === "string") {
					return value.toLowerCase() === "true";
				}
				return value != null ? !!value : value;
			},

			"string": function (value) {
				return value != null ? (value + "") : value;
			},

			"default": function (value) {
				return value;
			}
		};

		var roleMaper = (function () {
			var roles = {				
				"datepicker": function (element) {
					return element.data("kendoDatePicker");
				}
			};
			return function (element) {
				return roles[element.attr("data-role")](element);
			}
		})();

		binders.text = Binder.extend({
			init: function (element, bindings, options) {
				//call the base constructor
				Binder.fn.init.call(this, element, bindings, options);
				this.jelement = $(element);
				this.format = this.jelement.attr("data-format");
				this.parser = parsers[this.jelement.attr("data-parser") || "default"];
                this.parserFormat = this.jelement.attr("data-parser-format");
                this.parserCulture = this.jelement.attr("data-parser-culture");
			},
			refresh: function () {
				var text = this.bindings.text.get();
				if (text === null) {
					text = "";
				}
				else if (this.format) {
					text = toString(this.parser(text, this.parserFormat, this.parserCulture), this.format);
				}
				this.jelement.text(text);
			}
		});

		kendo.data.binders.widget.max = kendo.data.Binder.extend({
			init: function (widget, bindings, options) {
				//call the base constructor
				kendo.data.Binder.fn.init.call(this, widget.element[0], bindings, options);
			},
			refresh: function () {
				var that = this,
					value = that.bindings["max"].get(); //get the value from the View-Model
				roleMaper($(that.element)).max(value);
				//element.data("kendo" + element.attr("data-role")).max(value); //update the widget
			},
			change: function () {
				var that = this,
					value = this.element.value;
				if (!isNaN(value)) {
					that.bindings["max"].set(value);
				}
			}
		});

		kendo.data.binders.widget.min = kendo.data.Binder.extend({
			init: function (widget, bindings, options) {
				//call the base constructor
				kendo.data.Binder.fn.init.call(this, widget.element[0], bindings, options);
			},
			refresh: function () {
				var that = this,
					value = that.bindings["min"].get(); //get the value from the View-Model
				roleMaper($(that.element)).min(value);
				//element.data("kendo" + element.attr("data-role")).min(value); //update the widget
			},
			change: function () {
				var that = this,
					value = this.element.value;
				if (!isNaN(value)) {
					that.bindings["min"].set(value);
				}
			}
		});

	})(window.kendo.jQuery);

	return window.kendo;
}, typeof define == 'function' && define.amd ? define : function (_, f) { f(); });
