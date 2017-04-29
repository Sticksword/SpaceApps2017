
var model = {
    init : function(){

    },
};

var control = {
    // initialize function
    init: function(){

    }

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

