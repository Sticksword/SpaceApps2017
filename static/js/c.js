
var model = {
    init : function(){

    },
    url:"http://localhost:5000/",
};

var control = {
    // initialize function
    init: function(){

    },
    showData: function(){

    },
    ajaxClick: function(path){
        url_data = model.url+path;
        $.ajax({
            dataType:'text',
            url:url_data,
            success: function(data){

            },
            error: function(){
                console.log("cannot load data");
            }
        });
    },
};

// Generate Cesium map
var mapViewer = new Cesium.Viewer('cesiumContainer', {
    // imageryProvider : Cesium.createTileMapServiceImageryProvider({
    //     url : Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII')
    // }),
    imageryProvider : new Cesium.ArcGisMapServerImageryProvider({
        url : 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'
    }),
    baseLayerPicker : false,
    geocoder : false,
    animation : false,
    timeline : false,
    sceneMode : Cesium.SceneMode.SCENE2D
});

var imageryLayers = mapViewer.imageryLayers;
var viewModel = {
    layers : [],
    baseLayers : [],
    upLayer : null,
    downLayer : null,
    selectedLayer : null,
    isSelectableLayer : function(layer) {
        return baseLayers.indexOf(layer) >= 0;
    },
    raise : function(layer, index) {
        imageryLayers.raise(layer);
        viewModel.upLayer = layer;
        viewModel.downLayer = viewModel.layers[Math.max(0, index - 1)];
        updateLayerList();
        window.setTimeout(function() { viewModel.upLayer = viewModel.downLayer = null; }, 10);
    },
    lower : function(layer, index) {
        imageryLayers.lower(layer);
        viewModel.upLayer = viewModel.layers[Math.min(viewModel.layers.length - 1, index + 1)];
        viewModel.downLayer = layer;
        updateLayerList();
        window.setTimeout(function() { viewModel.upLayer = viewModel.downLayer = null; }, 10);
    },
    canRaise : function(layerIndex) {
        return layerIndex > 0;
    },
    canLower : function(layerIndex) {
        return layerIndex >= 0 && layerIndex < imageryLayers.length - 1;
    }
};
Cesium.knockout.track(viewModel);
var baseLayers = viewModel.baseLayers;

function setupLayers() {
    // Create all the base layers that this example will support.
    // These base layers aren't really special.  It's possible to have multiple of them
    // enabled at once, just like the other layers, but it doesn't make much sense because
    // all of these layers cover the entire globe and are opaque.
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

    // Create the additional layers
    addAdditionalLayerOption(
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
            }));
    addAdditionalLayerOption(
            'United States Weather Radar',
            new Cesium.WebMapServiceImageryProvider({
                url : 'https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi?',
                layers : 'nexrad-n0r',
                credit : 'Radar data courtesy Iowa Environmental Mesonet',
                parameters : {
                    transparent : 'true',
                    format : 'image/png'
                },
                // proxy : new Cesium.DefaultProxy('/proxy/')
            }));
    // addAdditionalLayerOption(
    //         'TileMapService Image',
    //         Cesium.createTileMapServiceImageryProvider({
    //             url : '../images/cesium_maptiler/Cesium_Logo_Color'
    //         }),
    //         0.2);
    // addAdditionalLayerOption(
    //         'Single Image',
    //         new Cesium.SingleTileImageryProvider({
    //             url : '../images/Cesium_Logo_overlay.png',
    //             rectangle : Cesium.Rectangle.fromDegrees(-115.0, 38.0, -107, 39.75)
    //         }),
    //         1.0);
    addAdditionalLayerOption(
            'Grid',
            new Cesium.GridImageryProvider(), 1.0, false);
    addAdditionalLayerOption(
            'Tile Coordinates',
            new Cesium.TileCoordinatesImageryProvider(), 1.0, false);
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

Cesium.knockout.getObservable(viewModel, 'selectedLayer').subscribe(function(baseLayer) {
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
$(document).ready(function(){
    control.init();

});
