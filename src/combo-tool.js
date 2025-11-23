import { runInAction } from "mobx";
import "./styles.scss";
import {
  BaseComponent,
  TimeSlider,
  DataNotes,
  DataWarning,
  ErrorMessage,
  LocaleService,
  LayoutService,
  CapitalVizabiService,
  MarkerContextmenu,
  TreeMenu,
  SteppedSlider,
  Dialogs,
  ButtonList,
  LegacyUtils,
  versionInfo
} from "@vizabi/shared-components";

const SPLIT_DIRECTION_ICON = `
  <svg class="vzb-icon" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="511.261px" height="511.261px" viewBox="0 0 511.261 511.261" style="enable-background:new 0 0 511.261 511.261;" xml:space="preserve">
    <g>
      <path d="M430.25,379.655l-75.982-43.869v59.771H120.73V151.966h59.774l-43.869-75.983L92.767,0L48.898,75.983L5.029,151.966h59.775v271.557c0,15.443,12.52,27.965,27.963,27.965h261.5v59.773l75.982-43.869l75.982-43.867L430.25,379.655z"/>
    </g>
  </svg>`;


export default class Combo extends BaseComponent {

  constructor(config){
    
    const toolComponents = config.options.toolComponents ? config.options.toolComponents : [BubbleChart.Base, ExtApiMap.Base];
    const toolPlaceholders = toolComponents.map(toolComponent => `vzb-${toolComponent.name.toLowerCase()}`);
  
    const fullMarker = config.model.markers?.bubble;
    const fullMarkerLegend = config.model.markers?.legend;
    const fullMarkerLegendMap = config.model.markers?.legend_map;

    config.Vizabi.utils.applyDefaults(fullMarker?.config, Combo.DEFAULT_MODEL.bubble);   
    config.Vizabi.utils.applyDefaults(fullMarkerLegend?.config || {}, Combo.DEFAULT_MODEL.legend);  
    config.Vizabi.utils.applyDefaults(fullMarkerLegendMap?.config || {}, Combo.DEFAULT_MODEL.legend_map);  
     
    const frameType = config.Vizabi.stores.encodings.modelTypes.frame;
    const { marker, splashMarker } = frameType.splashMarker(fullMarker);
    
    config.name = "combo";

    config.subcomponents = [{
      type: toolComponents[0].mainComponent,
      placeholder: "." + toolPlaceholders[0],
      model: marker,
      name: "chart"
    },{
      type: toolComponents[1].mainComponent,
      placeholder: "." + toolPlaceholders[1],
      model: marker,
      name: "chart"
    },{
      type: TimeSlider,
      placeholder: ".vzb-timeslider",
      model: marker,
      name: "time-slider"
    },{
      type: SteppedSlider,
      placeholder: ".vzb-speedslider",
      model: marker,
      name: "speed-slider"
    },{
      type: TreeMenu,
      placeholder: ".vzb-treemenu",
      model: marker,
      name: "tree-menu"
    },{
      type: MarkerContextmenu,
      placeholder: ".vzb-marker-contextmenu",
      model: marker,
      name: "marker-contextmenu"
    },{
      type: DataWarning,
      placeholder: ".vzb-datawarning",
      options: {appendButtonHere: ".vzb-tool-combo"},
      model: marker,
      name: "data-warning"
    },{
      type: DataNotes,
      placeholder: ".vzb-datanotes",
      model: marker
    },{
      type: Dialogs,
      placeholder: ".vzb-dialogs",
      model: marker,
      name: "dialogs"
    },{
      type: ButtonList,
      placeholder: ".vzb-buttonlist",
      model: marker,
      name: "buttons"
    },{
      type: ErrorMessage,
      placeholder: ".vzb-errormessage",
      model: marker,
      name: "error-message"
    }];

    config.template = `
    <div class="vzb-tool-combo vzb-split-vertical">
      <div class="vzb-chart-combo ${toolPlaceholders[0]}"></div>
      <div class="vzb-chart-combo ${toolPlaceholders[1]}"></div>
      <div class="vzb-split-line vzb-split-line-front"></div>
      <div class="vzb-split-direction-button vzb-noexport"></div>
      <div class="vzb-split-overlay vzb-hidden"></div>
      <div class="vzb-split-line vzb-split-line-drag vzb-hidden"></div>
    </div>
    <div class="vzb-animationcontrols">
      <div class="vzb-timeslider"></div>
      <div class="vzb-speedslider"></div>
    </div>
    <div class="vzb-sidebar">
      <div class="vzb-dialogs"></div>
      <div class="vzb-buttonlist"></div>
    </div>
    <div class="vzb-treemenu"></div>
    <div class="vzb-marker-contextmenu"></div>
    <div class="vzb-datawarning"></div>
    <div class="vzb-datanotes"></div>
    <div class="vzb-errormessage"></div>
    `;

    config.locale.Vizabi = config.Vizabi;
    config.layout.Vizabi = config.Vizabi;
    config.services = {
      Vizabi: new CapitalVizabiService({Vizabi: config.Vizabi}),
      locale: new LocaleService(config.locale),
      layout: new LayoutService(config.layout)
    };

    super(config);

    this.splashMarker = splashMarker;
  }

  setup(options) {
    this.DOM = {
      comboTool: this.element.select(".vzb-tool-combo"),
      splitDirectionButton: this.element.select(".vzb-split-direction-button"),
      splitOverlay: this.element.select(".vzb-split-overlay"),
      splitLine: this.element.select(".vzb-split-line"),
      splitLineDrag: this.element.select(".vzb-split-line-drag")
    }

    LegacyUtils.setIcon(this.DOM.splitDirectionButton, SPLIT_DIRECTION_ICON);

    const _this = this;
    this.DOM.splitLine.datum({});
    this.DOM.splitLine.call(
      d3.drag()
        .on("start", (event, d) => {
          if (_this.root.ui.chart.splitVertical) {
            d.xMin = 15;
            d.xMax = _this.toolWidth - 15;
            _this.DOM.splitLineDrag.attr("style", `transform: translateX(${event.x}px)`)
          } else {
            d.yMin = 15;
            d.yMax = _this.toolHeight - 15;
            _this.DOM.splitLineDrag.attr("style", `transform: translateY(${event.y}px)`)
          }
          _this.DOM.splitOverlay.classed("vzb-hidden", false);
          _this.DOM.splitLineDrag.classed("vzb-hidden", false);
        })
        .on("drag", (event, d) => {
          if (_this.root.ui.chart.splitVertical) {
            d._x = event.x < d.xMin ? d.xMin : event.x > d.xMax ? d.xMax : event.x;
            _this.DOM.splitLineDrag.attr("style", `transform: translateX(${d._x}px)`)
          } else {
            d._y = event.y < d.yMin ? d.yMin : event.y > d.yMax ? d.yMax : event.y;
            _this.DOM.splitLineDrag.attr("style", `transform: translateY(${d._y}px)`)
          }
        })
        .on("end", () => {
          _this.DOM.splitOverlay.classed("vzb-hidden", true);
          _this.DOM.splitLineDrag.classed("vzb-hidden", true);
          _this.DOM.splitLineDrag.attr("style", null);
        })
        .on("end.update", (event, d) => {
          runInAction(() => {
            if (_this.root.ui.chart.splitVertical) {
              _this.root.ui.chart.splitRatio = +((d._x / _this.toolWidth).toFixed(2));
            } else {
              _this.root.ui.chart.splitRatio = +((d._y / _this.toolHeight).toFixed(2));
            }
          });
        })
    );
    this.DOM.splitDirectionButton.on("click", () => {
      runInAction(() => {
        this.root.ui.chart.splitVertical = !this.root.ui.chart.splitVertical;
        this.root.ui.chart.splitRatio = 0.5;
      });
    });

  }

  changeSplitRatioOrDirection() {
    const styleAttr = this.DOM.comboTool.attr("style");
    const classAttr = this.DOM.comboTool.attr("class");
    const splitVertical = this.root.ui.chart.splitVertical;
    
    const splitDirectionClasses = ["vzb-split-horizontal", "vzb-split-vertical"];
    const classArray = splitVertical ? splitDirectionClasses : splitDirectionClasses.reverse();
    
    if (classAttr.includes(classArray[0])) {
      this.DOM.comboTool.classed(classArray[0], false);
      this.DOM.comboTool.classed(classArray[1], true);    
    }

    const ratio = this.root.ui.chart.splitRatio;
    const newStyleAttr = (splitVertical ? "grid-template-columns" : "grid-template-rows") + `: ${ratio}fr ${Math.floor(100-ratio*100)/100}fr`;
    
    if (newStyleAttr !== styleAttr) {
      this.DOM.comboTool.attr("style", newStyleAttr);
    }
    setTimeout(() => {
      this.services.layout._resizeHandler();
    }, 0);
  }

  resize() {
    this.services.layout.size;

    this.toolHeight = (this.DOM.comboTool.node().clientHeight) || 0;
    this.toolWidth = (this.DOM.comboTool.node().clientWidth) || 0;    
  }

  draw() {
    this.addReaction(this.resize);
    this.addReaction(this.changeSplitRatioOrDirection);
  }
  
}
Combo.DEFAULT_UI = {
  "locale": { "id": "en", "shortNumberFormat": true },
  "layout": { "projector": false },
  "buttons": {
    "buttons": ["markercontrols", "colors", "trails", "moreoptions", "presentation", "sidebarcollapse", "fullscreen"]
  },
  "dialogs": {
    "dialogs": {
      "popup": ["colors", "markercontrols", "moreoptions"],
      "sidebar": ["colors", "markercontrols", "mapcolors", "size", "zoom"],
      "moreoptions": [
        "opacity",
        "speed",
        "axes",
        "size",
        "colors",
        "label",
        "mapcolors",
        "mapoptions",
        "zoom",
        "technical",
        "presentation",
        "about"
      ]
    },
    "markercontrols": {
      "disableSlice": true,
      "disableAddRemoveGroups": true,
      "primaryDim": null,
      "drilldown": null,
      "shortcutForSwitch": false,
      "shortcutForSwitch_allow": null
    } 
  },
  "marker-contextmenu": {
    "primaryDim": null,
    "drilldown": null,
  },
  "tree-menu": {
    "showDataSources": false,
    "folderStrategyByDataset": {}
  },
  "chart": {
    "splitVertical": false,
    "splitRatio": 0.5,

    "show_ticks": true,
    "showForecast": false,
    "showForecastOverlay": true,
    "pauseBeforeForecast": true,
    "endBeforeForecast": null, //set this for each dataset
    "opacityHighlight": 1.0,
    "opacitySelect": 1.0,
    "opacityHighlightDim": 0.1,
    "opacitySelectDim": 0.3,
    "opacityRegular": 0.8,
    "timeInBackground": true,
    "timeInTrails": true,
    "lockNonSelected": 0,
    "numberFormatSIPrefix": true,
    "panWithArrow": true,
    "adaptMinMaxZoom": false,
    "cursorMode": "arrow",
    "zoomOnScrolling": true,
    "superhighlightOnMinimapHover": true,
    "whenHovering": {
      "showProjectionLineX": true,
      "showProjectionLineY": true,
      "higlightValueX": true,
      "higlightValueY": true
    },
    "labels": {
      "enabled": true,
      "dragging": true,
      "removeLabelBox": true
    },
    "margin": {
      "left": 0,
      "top": 0
    },
    "decorations": {
      "enabled": false,
      "xAxisGroups": null //left to be set by external page. example: {
      //   "gdp_pcap": [
      //     { "min": null, "max": 2650, "label": "incomegroups/level1", "label_short": "incomegroups/level1short" },
      //     { "min": 2650, "max": 8000, "label": "incomegroups/level2", "label_short": "incomegroups/level2short" },
      //     { "min": 8000, "max": 24200, "label": "incomegroups/level3", "label_short": "incomegroups/level3short" },
      //     { "min": 24200, "max": null, "label": "incomegroups/level4", "label_short": "incomegroups/level4short" }
      //   ]
      // }
    },

    "map": {
      "useBivariateColorScaleWithDataFromXY": false,
      "bivariateColorPalette": "BlPu5",
      "skipShapesLoading": false,
      "missingDataColor": false, //"#999" or false for transparent
      "preserveAspectRatio": true,
      "mapEngine": "mapbox",
      "mapStyle": "mapbox://styles/mapbox/light-v9",
      "showBubbles": false,
      "showAreas": true,
      "showMap": true,
      "path": null,
      "projection": "mercator",
      "topology": {
        "path": "assets/shapes.json",
        "objects": {
          "areas": "shapes",
          "boundaries": "shapes",
        },
        "geoIdProperty": "id",
      }
    }
  },
  "data-warning": {
    "enable": false,
    "margin": {
      "LARGE": { "bottom": 90 },
      "MEDIUM": { "bottom": 70 },
      "SMALL": { "bottom": 50 }
    }
  }
};

Combo.DEFAULT_MODEL = {
  "bubble": {
    "requiredEncodings": [],
    "requiredFields": {
      "bubbleRequired": ["x", "y", "size"],
      "mapRequired": ["size"]
    },

    "encoding": {
      "show": {
        "modelType": "selection"
      },
      "selected": {
        "modelType": "selection"
      },
      "highlighted": {
        "modelType": "selection"
      },
      "superhighlighted": {
        "modelType": "selection"
      },
      "order": {
        "modelType": "order",
        "direction": "desc",
        "data": {
          "ref": "markers.bubble.config.encoding.size.data"
        }
      },
      "color": {
        "data": {
          "constant": "_default"
        },
        "scale": {
          "modelType": "color",
          "type": "ordinal"
        }
      },
      "color_map": {
        "data": { },
        "scale": {
          "modelType": "color",
          "borrowZoom": true,
          "matchEncsToBorrowZoom": ["x", "y"],
        }
      },
      "size": {
        "data": { },
        "scale": {
          "modelType": "size",
          "allowedTypes": ["linear", "point"],
          "extent": [0, 1]
        }
      },
      "x": {
        "data": { },
        "scale": {
          "allowedTypes": ["linear", "log", "genericLog", "pow", "time"]
        }
      },
      "y": {
        "modelType": "lane",
        "data": { },
        "scale": {
          "allowedTypes": ["linear", "log", "genericLog", "pow", "time", "rank"]
        }
      },
      "label": {
        "data": {
          "modelType": "entityPropertyDataConfig"
        }
      },
      "size_label": {
        "data": {
          "constant": "_default"
        },
        "scale": {
          "modelType": "size",
          "allowedTypes": ["linear", "log", "genericLog", "pow", "point", "ordinal"],
          "extent": [0, 0.34]
        }
      },
      "trail": { "modelType": "trail", "show": false },
      "frame": {
        "modelType": "frame",
        "speed": 200,
        "splash": true
      },
      // To place bubbles on map pick centroid or lat and lon
      // "centroid": {
      //   "data": {
      //     "space": ["geo"],
      //     "concept": "geo"
      //   }
      // },
      // "lat": {
      //   data: {
      //     space: ["geo"],
      //     concept: "latitude"
      //   }
      // },
      // "lon": {
      //   data: {
      //     space: ["geo"],
      //     concept: "longitude"
      //   }
      // }
    }
  },
  "legend": {
    "data": {
      "ref": {
        "transform": "entityConceptSkipFilter",
        "path": "markers.bubble.encoding.color"
      }
    },
    "encoding": {
      "color": {
        "data": {
          "concept": { "ref": "markers.bubble.encoding.color.data.concept" },
          "constant": { "ref": "markers.bubble.encoding.color.data.constant" }
        },
        "scale": {
          "modelType": "color",
          "palette": { "ref": "markers.bubble.encoding.color.scale.palette" },
          "domain": null,
          "range": null,
          "type": null,
          "zoomed": null,
          "zeroBaseline": false,
          "clamp": false,
          "allowedTypes": null
        }
        //"scale": { "ref": "markers.bubble.encoding.color.scale" }
      },
      "name": { "data": {  } },
      "order": {
        "modelType": "order",
        "direction": "asc",
        "data": { }
      },
      "map": { "data": { } }
    }
  },
  "legend_map": {
    "data": {
      "ref": {
        "transform": "entityConceptSkipFilter",
        "path": "markers.bubble.encoding.color_map"
      }
    },
    "encoding": {
      "color": {
        "data": {
          "concept": { "ref": "markers.bubble.encoding.color_map.data.concept" },
          "constant": { "ref": "markers.bubble.encoding.color_map.data.constant" }
        },
        "scale": {
          "modelType": "color",
          "palette": { "ref": "markers.bubble.encoding.color_map.scale.palette" }
        }
        //"scale": { "ref": "markers.bubble.encoding.color.scale" }
      },
      "name": { "data": { } },
      "order": {
        "modelType": "order",
        "direction": "asc",
        "data": { }
      },
      "map": { "data": { } }
    }
  }
};

Combo.versionInfo = { version: __VERSION, build: __BUILD, package: __PACKAGE_JSON_FIELDS, sharedComponents: versionInfo};
