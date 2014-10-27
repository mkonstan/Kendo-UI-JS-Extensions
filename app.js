'use strict';
if (typeof jQuery === 'undefined') { throw new Error('This application\'s requires jQuery.'); }
if (typeof kendo === 'undefined') { throw new Error('This application\'s requires kendoui framework.'); }

if (typeof String.prototype.startsWith != 'function') {
	String.prototype.startsWith = function (str) {
		return this.slice(0, str.length) == str;
	};
}

if (typeof String.prototype.endsWith != 'function') {
	String.prototype.endsWith = function (str) {
		return this.slice(-str.length) == str;
	};
}

if (typeof Array.prototype.forEach != 'function') {
	Array.prototype.forEach = function (iterator) {
		var arr = this;
		for (var i = 0; i < arr.length; i++) {
			iterator.call(arr, arr[i], i, arr);
		}
	};
}

console.log("app");

(function ($) {
	var app = window.App = window.App || {},
		console = window.console = window.console || { log: function () { } },
		extend = $.extend,
        each = $.each,
        isArray = $.isArray,
        proxy = $.proxy,
        noop = $.noop,
        math = Math,
        JSON = window.JSON || {},
        FUNCTION = "function",
        STRING = "string",
        NUMBER = "number",
        OBJECT = "object",
        NULL = "null",
        BOOLEAN = "boolean",
        UNDEFINED = "undefined",
        slice = [].slice,
		Model = kendo.data.Model,
		ObservableObject = kendo.data.ObservableObject,
		DataSource = kendo.data.DataSource,
		Model = kendo.data.Model
	;
	app.Util = {
		isString: function (value) {
			return $.type(value) === "string";
		},
		isArray: function (value) {
			return $.isArray(value);
		},
		extend: extend
	};

	app.kendo = {
		defineModel: (function () {
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
		})(),
		defineObservable: (function () {
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
		})(),
		observable: function (base) {
			return new (app.kendo.defineObservable(base));
		},
		DataSource: {
			defaultParser: function (options) {
				return extend(true, { schema: { parse: function (data) { return data; } } }, options || {});
			},
			readOptions: function (options) {
				return {
					transport: {
						read: options
					}
				};
			},
			define: function (options) {
				var
					 ERROR = "error"
					, defaults = options
				;

				return kendo.data.DataSource.extend(new function () {
					var that = this;
					function _attachBubbleHandlers() {
						var that = this;

						that._data.bind(ERROR, function (e) {
							that.trigger(ERROR, e);
						});
					};

					that.init = function (options) {
						var that = this;
						var config = extend(true, {}, defaults || {}, options || {});
						DataSource.fn.init.call(this, config);
						_attachBubbleHandlers.call(that);
					};

					that.clone = function (options) {
						return new (app.kendo.DataSource.define(defaults))(options);
					};
				});
			},
			create: function (options) {
				return new (app.kendo.DataSource.define(options))({});
			}
		},
		Grid: {
			define: (function () {
				var
					grid = kendo.ui.Grid,
					map = $.map,
					inArray = $.inArray,
					grep = $.grep
				;

				function isString(value) {
					return typeof value === STRING;
				};


				function lockedColumns(columns) {
					return grep(columns, function(column) {
						return column.locked;
					});
				};

				function addHiddenStyle(attr) {
					attr = attr || {};
					var style = attr.style;

					if (!style) {
						style = "display:none";
					} else {
						style = style.replace(/((.*)?display)(.*)?:([^;]*)/i, "$1:none");
						if (style === attr.style) {
							style = style.replace(/(.*)?/i, "display:none;$1");
						}
					}

					return extend({}, attr, { style: style });
				};

				function nonLockedColumns(columns) {
					return grep(columns, function (column) {
						return !column.locked;
					});
				};

				function normalizeHeaderCells(th, columns) {
					var lastIndex = 0;
					var idx, len;

					for (idx = 0, len = columns.length; idx < len; idx++) {
						if (columns[idx].locked) {
							th.eq(idx).insertBefore(th.eq(lastIndex));
							lastIndex++;
						}
					}
				};

				return function (name, defaults) {

					function _preprocessOptions(options) {
						options.toolbar = options.toolbar || options.toolbarTemplate;
						var editable = options.editable;
						if (editable) {
							if (isString(editable)) editable = { mode: editable };

							if (editable.mode === "popup" && options.editableTemplate) {
								editable = $.extend(editable, { template: options.editableTemplate });
							}
							options.editable = editable;
						}
						return options;
					};

					var o = grid.extend({
						options: {
							name: name,
							toolbarTemplate: null,
							editableTemplate: null
						},
						init: function (element, options) {
							var that = this;
							grid.fn.init.call(that, element, _preprocessOptions(extend(true, {}, defaults, options)));
							//$(element).data("kendoGrid", that);
						},

						_modelForContainer: function (container) {
							var that = this;
							var obj = { container: container, model: grid.fn._modelForContainer.call(that, container) };
							that.trigger("editorModel", obj);
							return obj.model;
						},

						_columns: function (columns) {
							var that = this,
								table = that.table,
								encoded,
								cols = table.find("col"),
								lockedCols,
								dataSource = that.options.dataSource;

							// using HTML5 data attributes as a configuration option e.g. <th data-field="foo">Foo</foo>
							var OPTIONS = {
								"title": "",
								"sortable": false,
								"filterable": false,
								"type": "",
								"groupable": false,
								"field": null,
								"menu": null,
								"format": null,
								"template": null,
								"command": null,
								//"editor": null,
								"editorTemplate": null,
								"groupFooterTemplate": null,
								"footerTemplate": null,
								"width": null
							};

							columns = columns.length ? columns : map(table.find("th"), function (th, idx) {
								th = $(th);
								var options = kendo.parseOptions(th[0], OPTIONS);
								if (!options.field) {
									options.field = th.text().replace(/\s|[^A-z0-9]/g, "");
								}
								if (cols.length !== 0 && !options.width) {
									options.width = cols.eq(idx).css("width");
								}
								if (options.editorTemplate) {
									var editorTemplate = options.editorTemplate;
									options.editor = function (container, options) {
										container.append(editorTemplate(options.model));
									};
								};
								return options;
							});

							encoded = !(that.table.find("tbody tr").length > 0 && (!dataSource || !dataSource.transport));

							if (that.options.scrollable) {
								var initialColumns = columns;
								lockedCols = lockedColumns(columns);
								columns = nonLockedColumns(columns);

								if (lockedCols.length > 0 && columns.length === 0) {
									throw new Error("There should be at least one non locked columns");
								}

								normalizeHeaderCells(that.element.find("tr:has(th):first").find("th:not(.k-group-cell)"), initialColumns);
								columns = lockedCols.concat(columns);
							}

							that.columns = map(columns, function (column) {
								column = typeof column === STRING ? { field: column } : column;
								if (column.hidden) {
									column.attributes = addHiddenStyle(column.attributes);
									column.footerAttributes = addHiddenStyle(column.footerAttributes);
									column.headerAttributes = addHiddenStyle(column.headerAttributes);
								}

								return extend({ encoded: encoded }, column);
							});
						}

					});
					kendo.ui.plugin(o);
				};
			})(),
		}
	};

	var callbacksPipeline = [];

	var pipelineInit = function () {
		var that = this;
		var callbacks = $.Callbacks("once");
		callbacksPipeline.push(callbacks);
		return function (delegate) {
			callbacks.add(function () {
				delegate.call(that, that, app);
			});
		}
	};

	app.State = {};
	app.Model = app.Model || { name: "App.Model" };

	app.DataSource = app.DataSource || { name: "App.DataSource" };

	app.init = pipelineInit.call(app);
	app.Model.define = pipelineInit.call(app.Model);
	app.DataSource.define = pipelineInit.call(app.DataSource);
	app.start = pipelineInit.call(app);

	$(document).ready(function () {
		while (callbacksPipeline.length > 0) {
			callbacksPipeline.shift().fire();
		}
	});
})(jQuery);
