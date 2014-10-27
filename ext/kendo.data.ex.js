(function (f, define) {
	define([], f);
})(function () {

	/*jshint eqnull: true, loopfunc: true, evil: true */
	(function ($, undefined) {
		var extend = $.extend,
			proxy = $.proxy,
			map = kendo.map,
			first = function (data, predicate) {
				var that = this;
				var array = data;
				for (var i = 0, j = array.length; i < j; i++)
					if (predicate.call(that, array[i]))
						return array[i];
				return null;
			},
			DataSource = kendo.data.DataSource;
		
		DataSource.prototype.first = function (predicate) {
			var that = this;
			return first.call(that, that.data(), predicate);
		};

		DataSource.prototype.toJSON = function () {
			var that = this;
			return map.call(that, that.data(), function (item) {
				return item.toJSON();
			});
		};

		DataSource.prototype.proxy = DataSource.prototype.asFunc = function (context) {
			var ds = this;
			return proxy(function () {
				return ds;
			}, context || ds);
		};
	})(window.kendo.jQuery);

	return window.kendo;

}, typeof define == 'function' && define.amd ? define : function (_, f) { f(); });