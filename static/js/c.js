var gibs = gibs || {};

var model = {
    init: function () {

    },
    url: "/",
    data: [],
    currentData: [],
    predictedData: [],
    currentIndex: 0,
    rectangles: null
};
// Initially start at June 15, 2014
var initialTime = Cesium.JulianDate.fromDate(
    new Date(Date.UTC(2014, 5, 15)));

// Earliest date of Corrected Reflectance in archive: May 8, 2012
var startTime = Cesium.JulianDate.fromDate(
    new Date(Date.UTC(2012, 5, 8)));

var endTime = Cesium.JulianDate.now();


// Keep track of the previous day. Only update the layer on a tick if the
// day has actually changed.
var previousTime = null;

var isoDate = function (isoDateTime) {
    return isoDateTime.split("T")[0];
}

var clock = new Cesium.Clock({
    startTime: startTime,
    endTime: endTime,
    currentTime: initialTime,
    multiplier: 0,   // Don't start animation by default
    clockRange: Cesium.ClockRange.UNBOUNDED
});

var updateLayers = throttle(function () {
    var isoDateTime = clock.currentTime.toString();
    var time = isoDate(isoDateTime);
    var layers = mapViewer.scene.imageryLayers;
    layers.removeAll();

    setupLayers();
    /*_.each(selectedSet.layers, function(layer_id) {
     layers.addImageryProvider(createProvider(layer_id));
     }*/
    //setupLayers();
}, 250, {leading: true, trailing: true});
;

var onClockUpdate = function () {
    var isoDateTime = clock.currentTime.toString();
    var time = isoDate(isoDateTime);
    if (time !== previousTime) {
        previousTime = time;
        //updateLayers();
        //Bind the viewModel to the DOM elements of the UI that call for it.
        //var toolbar = document.getElementById('toolbar');
        //var element = document.getElementById('toolbar');
        //Cesium.knockout.cleanNode(element);
        //Cesium.knockout.applyBindings(viewModel, element);
    }
};

var control = {
    // initialize function
    init: function () {

    },
    showData: function () {

    },
    ajaxClick: function (path, lat1, lon1, lat2, lon2) {
        var query = "?lat_1=" + lat1 + "&lon_1=" + lon1 + "&lat_2=" + lat2 + "&lon_2=" + lon2;
        url = model.url + path + query;
        $.getJSON(url, function (data) {
            model.currentData = data.current;
            model.predictedData = data.predicted;
            document.getElementById("cronCurrent").disabled = false;
            document.getElementById("cronPredicted").disabled = false;

            document.getElementById("soybeanCurrent").disabled = false;
            document.getElementById("soybeanPredicted").disabled = false;
            //control.putData();
            // for(var i = 0; i < data.current.length; i++){
            //     if(data.current[i].type == 1){
            //         //var count = 0
            //         var indensity = (data.current[i].ct/138233.5)*0.5;
            //         if (indensity > 0.5){
            //             cropView.cropLayer(data.current[i], new Cesium.Color(1.0, 0.0, 0.0, 0.5));
            //         }else{
            //             cropView.cropLayer(data.current[i], new Cesium.Color(1.0, 0.0, 0.0, indensity));
            //         }

            //     }
            // }

            // for(var i = 0; i < data.predicted.length; i++){
            //     if(data.predicted[i].type == 1){
            //         //var count = 0
            //         var indensity = (data.predicted[i].ct/138233.5)*0.5;
            //         if (indensity > 0.5){
            //             cropView.cropLayer(data.predicted[i], new Cesium.Color(0.0, 0.0, 1.0, 0.5));
            //         }else{
            //             cropView.cropLayer(data.predicted[i], new Cesium.Color(0.0, 0.0, 1.0, indensity));
            //         }

            //     }
            // }
        }).error(function () {
            console.log('cannot load index data');
        });
    }
};

var cropView = {
    init: function () {

    },
    cropLayer: function (item, cropColor) {
        var lonReal = function (elem) {
            if (elem > 180) {
                elem = -360 + elem;
                //elem = 179.99;
            }

            if (elem < -180) {
                elem = 360 + elem;
                //elem = -179.99;
            }

            return elem;
        };

        var latReal = function (elem) {
            if (elem > 90) {
                elem = 89.99;
            }

            if (elem < -90) {
                elem = -89.99;
            }

            return elem;
        };

        var calculate = function (lonX, latY) {

            //1 min cover area(1/60*0.5)
            var oneMin = 30 * (1 / 60);

            var e = lonX + oneMin;
            e = lonReal(e);

            var w = lonX;
            w = lonReal(w);

            var s = latY;
            s = latReal(s);

            var n = latY + oneMin - 0.06;
            n = latReal(n);

            var location = [w, s, e, n];
            return location;
        };
        var result = calculate(item.lng, item.lat);

        var instance = new Cesium.GeometryInstance({
            geometry: new Cesium.RectangleGeometry({
                rectangle: Cesium.Rectangle.fromDegrees(result[0], result[1], result[2], result[3]),
                vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT
            })
        });

        mapViewer.scene.primitives.add(new Cesium.Primitive({
            geometryInstances: instance,
            appearance: new Cesium.EllipsoidSurfaceAppearance({
                material: Cesium.Material.fromType('Color', {
                    color: cropColor
                })
            })
        }));
        // model.rectangles.add({
        // name : item.id,
        // rectangle : {
        //     coordinates : Cesium.Rectangle.fromDegrees(result[0], result[1], result[2], result[3]),
        //     material : Cesium.Color.RED.withAlpha(0.5),
        //     height : 100.0,
        // }
        // });
    }

}

// Generate Cesium map
var mapViewer = new Cesium.Viewer('cesiumContainer', {
    imageryProvider: new Cesium.ArcGisMapServerImageryProvider({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'
    }),
    clock: clock,
    baseLayerPicker: false,
    geocoder: false,
    animation: true,
    timeline: true,
    sceneMode: Cesium.SceneMode.SCENE2D
});


var imageryLayers = mapViewer.imageryLayers;

var viewModel = {
    layers: [],
    baseLayers: [],
    upLayer: null,
    downLayer: null,
    selectedLayer: null,
    isSelectableLayer: function (layer) {
        return baseLayers.indexOf(layer) >= 0;
    },
    raise: function (layer, index) {
        imageryLayers.raise(layer);
        viewModel.upLayer = layer;
        viewModel.downLayer = viewModel.layers[Math.max(0, index - 1)];
        updateLayerList();
        window.setTimeout(function () {
            viewModel.upLayer = viewModel.downLayer = null;
        }, 10);
    },
    lower: function (layer, index) {
        imageryLayers.lower(layer);
        viewModel.upLayer = viewModel.layers[Math.min(viewModel.layers.length - 1, index + 1)];
        viewModel.downLayer = layer;
        updateLayerList();
        window.setTimeout(function () {
            viewModel.upLayer = viewModel.downLayer = null;
        }, 10);
    },
    canRaise: function (layerIndex) {
        return layerIndex > 0;
    },
    canLower: function (layerIndex) {
        return layerIndex >= 0 && layerIndex < imageryLayers.length - 1;
    }
};
Cesium.knockout.track(viewModel);
var baseLayers = viewModel.baseLayers;

function throttle(fn, threshhold, scope) {
    threshhold || (threshhold = 250);
    var last,
        deferTimer;
    return function () {
        var context = scope || this;

        var now = +new Date,
            args = arguments;
        if (last && now < last + threshhold) {
            // hold on to it
            clearTimeout(deferTimer);
            deferTimer = setTimeout(function () {
                last = now;
                fn.apply(context, args);
            }, threshhold);
        } else {
            last = now;
            fn.apply(context, args);
        }
    };
}

function setupLayers() {
    // Create all the base layers that this example will support.
    // These base layers aren't really special.  It's possible to have multiple of them
    // enabled at once, just like the other layers, but it doesn't make much sense because
    // all of these layers cover the entire globe and are opaque.
    var isoDateTime = clock.currentTime.toString();
    var time = "TIME=" + isoDate(isoDateTime);
    /*
     addBaseLayerOption(
     'Bing Maps Aerial',
     undefined); // the current base layer
     addBaseLayerOption(
     'Bing Maps Road',
     new Cesium.BingMapsImageryProvider({
     url : 'https://dev.virtualearth.net',
     mapStyle: Cesium.BingMapsStyle.ROAD
     }));
     addBaseLayerOption(
     'ArcGIS World Street Maps',
     new Cesium.ArcGisMapServerImageryProvider({
     url : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'
     }));
     addBaseLayerOption(
     'OpenStreetMaps',
     Cesium.createOpenStreetMapImageryProvider());
     addBaseLayerOption(
     'MapQuest OpenStreetMaps',
     Cesium.createOpenStreetMapImageryProvider({
     url : 'https://otile1-s.mqcdn.com/tiles/1.0.0/osm/'
     }));
     addBaseLayerOption(
     'Stamen Maps',
     Cesium.createOpenStreetMapImageryProvider({
     url : 'https://stamen-tiles.a.ssl.fastly.net/watercolor/',
     fileExtension: 'jpg',
     credit: 'Map tiles by Stamen Design, under CC BY 3.0. Data by OpenStreetMap, under CC BY SA.'
     }));
     addBaseLayerOption(
     'USGS Shaded Relief (via WMTS)',
     new Cesium.WebMapTileServiceImageryProvider({
     url : 'http://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer/WMTS',
     layer : 'USGSShadedReliefOnly',
     style : 'default',
     format : 'image/jpeg',
     tileMatrixSetID : 'default028mm',
     maximumLevel: 19,
     credit : new Cesium.Credit('U. S. Geological Survey')
     }));
     */
    // Create the additional layers
    addAdditionalLayerOption(
        'MODIS_Terra_Cloud_Water_Path',
        new Cesium.WebMapTileServiceImageryProvider({
            url: "https://map1.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi?" + time,
            layer: "MODIS_Terra_Cloud_Water_Path",
            style: "",
            format: "image/png",
            tileMatrixSetID: "EPSG4326_1km",
            maximumLevel: 6,
            tileWidth: 256,
            tileHeight: 256,
            tilingScheme: gibs.GeographicTilingScheme()
        }), 1.0, true);

    addAdditionalLayerOption(
        'AIRS_Precipitation_Day',
        new Cesium.WebMapTileServiceImageryProvider({
            url: "https://map1.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi?" + time,
            layer: "AIRS_Precipitation_Day",
            style: "",
            format: "image/png",
            tileMatrixSetID: "EPSG4326_2km",
            maximumLevel: 5,
            tileWidth: 256,
            tileHeight: 256,
            tilingScheme: gibs.GeographicTilingScheme()
        }), 1.0, false);

    addAdditionalLayerOption(
        'Aquarius_Soil_Moisture_Daily',
        new Cesium.WebMapTileServiceImageryProvider({
            url: "https://map1.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi?" + time,
            layer: "Aquarius_Soil_Moisture_Daily",
            style: "",
            format: "image/png",
            tileMatrixSetID: "EPSG4326_2km",
            maximumLevel: 5,
            tileWidth: 256,
            tileHeight: 256,
            tilingScheme: gibs.GeographicTilingScheme()
        }), 1.0, false);

    addAdditionalLayerOption(
        'MISR_Land_NDVI_Average_Monthly',
        new Cesium.WebMapTileServiceImageryProvider({
            url: "https://map1.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi?" + time,
            layer: "MISR_Land_NDVI_Average_Monthly",
            style: "",
            format: "image/png",
            tileMatrixSetID: "EPSG4326_2km",
            maximumLevel: 5,
            tileWidth: 256,
            tileHeight: 256,
            tilingScheme: gibs.GeographicTilingScheme()
        }), 1.0, false);
    /*addAdditionalLayerOption(
     'Daymet_v3',
     new Cesium.WebMapServiceImageryProvider({
     url : 'https://thredds.ornl.gov/thredds/wms/ornldaac/1328/1988/daymet_v3_tmin_1988_na.nc4',
     layers : '0',
     }));*/
    // Create the additional layers
    /*addAdditionalLayerOption(
     'United States GOES Infrared',
     new Cesium.WebMapServiceImageryProvider({
     url : 'https://mesonet.agron.iastate.edu/cgi-bin/wms/goes/conus_ir.cgi?',
     layers : 'goes_conus_ir',
     credit : 'Infrared data courtesy Iowa Environmental Mesonet',
     parameters : {
     transparent : 'true',
     format : 'image/png'
     },
     // proxy : new Cesium.DefaultProxy('/proxy/')
     }));*/
    /*
     addAdditionalLayerOption(
     'Grid',
     new Cesium.GridImageryProvider());
     addAdditionalLayerOption(
     'Tile Coordinates',
     new Cesium.TileCoordinatesImageryProvider());
     */
}
setupLayers();
updateLayerList();
function addBaseLayerOption(name, imageryProvider) {
    var layer;
    if (typeof imageryProvider === 'undefined') {
        layer = imageryLayers.get(0);
        viewModel.selectedLayer = layer;
    } else {
        layer = new Cesium.ImageryLayer(imageryProvider);
    }

    layer.name = name;
    baseLayers.push(layer);
}

function addAdditionalLayerOption(name, imageryProvider, alpha, show) {
    var layer = imageryLayers.addImageryProvider(imageryProvider);
    layer.alpha = Cesium.defaultValue(alpha, 0.5);
    layer.show = Cesium.defaultValue(show, true);
    layer.name = name;
    Cesium.knockout.track(layer, ['alpha', 'show', 'name']);
}

function updateLayerList() {
    var numLayers = imageryLayers.length;
    viewModel.layers.splice(0, viewModel.layers.length);
    for (var i = numLayers - 1; i >= 0; --i) {
        viewModel.layers.push(imageryLayers.get(i));
    }
}


//Bind the viewModel to the DOM elements of the UI that call for it.
var toolbar = document.getElementById('toolbar');
Cesium.knockout.applyBindings(viewModel, toolbar);


Cesium.knockout.getObservable(viewModel, 'selectedLayer').subscribe(function (baseLayer) {
    // Handle changes to the drop-down base layer selector.
    var activeLayerIndex = 0;
    var numLayers = viewModel.layers.length;
    for (var i = 0; i < numLayers; ++i) {
        if (viewModel.isSelectableLayer(viewModel.layers[i])) {
            activeLayerIndex = i;
            break;
        }
    }
    var activeLayer = viewModel.layers[activeLayerIndex];
    var show = activeLayer.show;
    var alpha = activeLayer.alpha;
    imageryLayers.remove(activeLayer, false);
    imageryLayers.add(baseLayer, numLayers - activeLayerIndex - 1);
    baseLayer.show = show;
    baseLayer.alpha = alpha;
    updateLayerList();
});

mapViewer.clock.onTick.addEventListener(onClockUpdate);
onClockUpdate();

var crops = [
    {
        name: "cron",
        value: 1,
        color: new Cesium.Color(1.0, 0.0, 0.0, 0.3)
    },
    {
        name: "wheat",
        value: 2,
        color: new Cesium.Color(0.0, 1.0, 0.0, 0.3)
    }
];

var Crop = function (data) {
    var self = this;
    self.name = ko.observable(data.name);
    self.value = ko.observable(data.value);
    self.color = ko.observable(data.color);
};

$('#crop_selection .checkbox').click(function () {

    var cronCurrentCheck = document.getElementById("cronCurrent").checked;
    var cronPredictedCheck = document.getElementById("cronPredicted").checked;

    var soybeanCurrentCheck = document.getElementById("soybeanCurrent").checked;
    var soybeanPredictedCheck = document.getElementById("soybeanPredicted").checked;
    mapViewer.scene.primitives.removeAll();

    // cronCurrentCheck
    if (cronCurrentCheck) {
        for (var i = 0; i < model.currentData.length; i++) {
            if (model.currentData[i].type == 1) {
                //var count = 0
                var indensity = (model.currentData[i].ct / 138233.5) * 0.5;
                if (indensity > 0.5) {
                    cropView.cropLayer(model.currentData[i], new Cesium.Color(1.0, 0.0, 0.0, 0.5));
                } else {
                    cropView.cropLayer(model.currentData[i], new Cesium.Color(1.0, 0.0, 0.0, indensity));
                }

            }
        }

    }

    // cronPredictedCheck
    if (cronPredictedCheck) {
        for (var i = 0; i < model.predictedData.length; i++) {
            if (model.predictedData[i].type == 1) {
                //var count = 0
                var indensity = (model.predictedData[i].ct / 138233.5) * 0.5;
                if (indensity > 0.5) {
                    cropView.cropLayer(model.predictedData[i], new Cesium.Color(0.0, 0.0, 1.0, 0.5));
                } else {
                    cropView.cropLayer(model.predictedData[i], new Cesium.Color(0.0, 0.0, 1.0, indensity));
                }

            }
        }
    }

    // soybeanCurrentCheck
    if (soybeanCurrentCheck) {
        for (var i = 0; i < model.currentData.length; i++) {
            if (model.currentData[i].type == 5) {
                //var count = 0
                var indensity = (model.currentData[i].ct / 138233.5) * 0.5;
                if (indensity > 0.5) {
                    cropView.cropLayer(model.currentData[i], new Cesium.Color(1.0, 0.0, 0.0, 0.5));
                } else {
                    cropView.cropLayer(model.currentData[i], new Cesium.Color(1.0, 0.0, 0.0, indensity));
                }

            }
        }
    }

    // soybeanPredictedCheck
    if (soybeanPredictedCheck) {
        for (var i = 0; i < model.predictedData.length; i++) {
            if (model.predictedData[i].type == 5) {
                //var count = 0
                var indensity = (model.predictedData[i].ct / 138233.5) * 0.5;
                if (indensity > 0.5) {
                    cropView.cropLayer(model.predictedData[i], new Cesium.Color(0.0, 0.0, 1.0, 0.5));
                } else {
                    cropView.cropLayer(model.predictedData[i], new Cesium.Color(0.0, 0.0, 1.0, indensity));
                }

            }
        }
    }
    //control.putData();
    // for(var i = 0; i < data.current.length; i++){
    //     if(data.current[i].type == 1){
    //         //var count = 0
    //         var indensity = (data.current[i].ct/138233.5)*0.5;
    //         if (indensity > 0.5){
    //             cropView.cropLayer(data.current[i], new Cesium.Color(1.0, 0.0, 0.0, 0.5));
    //         }else{
    //             cropView.cropLayer(data.current[i], new Cesium.Color(1.0, 0.0, 0.0, indensity));
    //         }

    //     }
    // }

    // for(var i = 0; i < data.predicted.length; i++){
    //     if(data.predicted[i].type == 1){
    //         //var count = 0
    //         var indensity = (data.predicted[i].ct/138233.5)*0.5;
    //         if (indensity > 0.5){
    //             cropView.cropLayer(data.predicted[i], new Cesium.Color(0.0, 0.0, 1.0, 0.5));
    //         }else{
    //             cropView.cropLayer(data.predicted[i], new Cesium.Color(0.0, 0.0, 1.0, indensity));
    //         }

    //     }
    // }
});

function uncheck() {
    document.getElementById("myCheck").checked = false;
}

// var ViewModelCrop = function(){
//   var self = this;

//   self.cropList = ko.observableArray([]);
//   crops.forEach(function(cropItem){
//     self.cropList.push(new Crop(cropItem));
//   });
//   // console.log(self.catList());
//   self.currentCrop = ko.observable(self.cropList()[0]);

//   self.show = function(){
//     // remove all entity

//     // insert new entity
//     for(var i = 0; i < model.data.length; i++){
//         if(model.data[i].type == self.currentCrop.value){
//             var count = 0
//             cropView.cropLayer(data[i], color);
//         }
//     }
//   };

//   self.selectCrop = function(crop){
//     self.currentCrop(crop);
//   };
// }

// ko.applyBindings(new ViewModelCrop());

$(document).ready(function () {
    control.init();
    control.ajaxClick("points", 28, -125, 48, -60);
    document.getElementById("cronCurrent").disabled = true;
    document.getElementById("cronPredicted").disabled = true;

    document.getElementById("soybeanCurrent").disabled = true;
    document.getElementById("soybeanPredicted").disabled = true;
});
