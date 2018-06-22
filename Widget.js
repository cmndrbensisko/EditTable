///////////////////////////////////////////////////////////////////////////
// Copyright © 2018 Adam Drackley. All Rights Reserved.
///////////////////////////////////////////////////////////////////////////
define([
        'dojo/_base/declare',
        'dojo/_base/lang',
        'dojo/_base/array',
        'jimu/BaseWidget',
        'jimu/LayerInfos/LayerInfos',
        'jimu/WidgetManager',
        'dojo/query',
        'dojo/dom-construct',
        "esri/dijit/FeatureTable",
        "esri/request",
        "esri/graphic",
        "dojo/_base/lang",
        "dojo/on",
        'esri/dijit/BasemapGallery',
        'esri/dijit/BasemapLayer',
        'esri/dijit/Basemap',
    ],
    function(
        declare,
        lang,
        array,
        BaseWidget,
        LayerInfos,
        WidgetManager,
        query,
        domConstruct,
        FeatureTable,
        esriRequest,
        Graphic,
        lang,
        on,
        BasemapGallery,
        BasemapLayer,
        Basemap
    ) {

        var clazz = declare([BaseWidget], {
            name: 'EditTable',
            baseClass: 'widget-edittable',
            myFeaturelayer: null,
            myTable: null,

            startup: function() {
                this.inherited(arguments)
            },

            onOpen: function() {
				//esri.config.defaults.io.useCors = "with-credentials"
				//esri.config.defaults.io.corsEnabledServers.push({host:"<CORS MACHINE NAME HERE>",withCredentials: true});
				
                require(['xstyle/css!widgets/EditTable/css/style.css'], function(css) {})

                var FLurl = _widgetManager.getWidgetsByName('AttributeTable')[0]._activeTable.layer.url
                this.myFeatureLayer = _widgetManager.getWidgetsByName('AttributeTable')[0]._activeTable.layer

                if (this.myFeatureLayer.type == "Table" && this.myFeatureLayer.url.indexOf("FeatureServer") > -1) {
                    domConstruct.create("div", {
                        'id': 'editableTable'
                    }, _widgetManager.getWidgetsByName('AttributeTable')[0]._activeTable.grid.domNode, 'before')
                    dojo.setStyle(_widgetManager.getWidgetsByName('AttributeTable')[0]._activeTable.grid.domNode, "display", "none")
	                dojo.forEach(dojo.query('.jimu-widget-attributetable-feature-table-footer'),function(foot){
	                	dojo.setStyle(foot, "display", "none")	
	                })

                    this.myTable = new FeatureTable({
                        featureLayer: this.myFeatureLayer,
                        showAttachments: true,
                        showGridHeader: true,
                        showGridMenu: true,
                        editable: true,
                        menuFunctions: [{
                            label: "Add Feature",
                            callback: function(evt) {
                                addUrl = FLurl + "/applyEdits"
                                var addFeature = esriRequest({
                                    url: addUrl,
                                    content: {
                                        f: "json"
                                    },
                                    handleAs: "json",
                                    content: {
                                        adds: '[{"id":222,"adds":[],"updates":[],"deletes":[]}]',
                                        f: "json"
                                    }
                                }, {
                                    usePost: true
                                }).then(lang.hitch(this, function(evt) {
                                    this.refresh()
                                }))
                            }
                        }, {
                            label: "Delete Feature",
                            callback: function(evt) {
                                var delGraphics = []
                                dojo.forEach(this.selectedRowIds, lang.hitch(this, function(ID) {
                                    var deljson = '{"' + this.layer.objectIdField + '":"' + ID + '"}'
                                    delGraphics.push(new Graphic(null, null, JSON.parse(deljson), null))
                                }))
                                this.layer.applyEdits(null, null, delGraphics).then(lang.hitch(this, function(evt) {
                                    this.refresh()
                                }))
                            }
                        }]
                    }, "editableTable");

                    this.myTable.startup();
                    this.own(on(_widgetManager.getWidgetsByName('AttributeTable')[0]._activeTable.grid, "dgrid-refresh-complete", lang.hitch(this, function(evt) {
                        this.myTable.clearFilter()
                        if (evt.results.length > 0) {
                            this.myTable.selectRows(evt.results)
                            this.myTable.filterSelectedRecords()
                        }
                    })))
                    dojo.forEach(_widgetManager.getWidgetsByName('AttributeTable')[0].layerTabPages, lang.hitch(this, function(tab) {
                        this.own(on(tab.controlButton.domNode, "click", lang.hitch(this, function(evt) {
                            this.destroy()
                            this.onClose()
                        })))
                    }))
                    _widgetManager.getWidgetsByName('AttributeTable')[0]._activeTable.refresh()
                } else {
                    alert("Current AttributeTable Table is either Not a Table or Not Editable")
                }
            },

            onClose: function() {
                this.myTable.destroy();
                dojo.setStyle(_widgetManager.getWidgetsByName('AttributeTable')[0]._activeTable.grid.domNode, "display", "block")
                dojo.forEach(dojo.query('.jimu-widget-attributetable-feature-table-footer'),function(foot){
                	dojo.setStyle(foot, "display", "")	
                })
            }

        });
        return clazz;
    });