(function(f, define){
    define(["kendo"], f);
})(function(){

    /* jshint eqnull: true */
    (function($, undefined) {
        var kendo = window.kendo,
            FUNCTION = "function",
            STRING = "string",
            extend = $.extend,
            map = $.map,
            grep = $.grep,
            isArray = $.isArray,
            inArray = $.inArray,
            ui = kendo.ui,
            grid = kendo.ui.Grid;
        var templateCach = [];

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
        }

        function nonLockedColumns(columns) {
            return grep(columns, function(column) {
                return !column.locked;
            });
        }

        function normalizeHeaderCells(th, columns) {
            var lastIndex = 0;
            var idx , len;

            for (idx = 0, len = columns.length; idx < len; idx ++) {
                if (columns[idx].locked) {
                    th.eq(idx).insertBefore(th.eq(lastIndex));
                    lastIndex ++;
                }
            }
        }

        var MvvmGrid = (function () {

        	grid.prototype.events.push("editorModel");

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

        	return grid.extend({
        		options: {
        			name: "Grid",
        			toolbarTemplate: null,
        			editableTemplate: null
        		},
        		init: function (element, options) {
        			var that = this;
        			grid.fn.init.call(that, element, _preprocessOptions(options));
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

        			columns = columns.length ? columns : map(table.find("th"), function(th, idx) {
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

        			that.columns = map(columns, function(column) {
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
        })();

        ui.plugin(MvvmGrid);
    })(window.kendo.jQuery);

    return window.kendo;

}, typeof define == 'function' && define.amd ? define : function(_, f){ f(); });