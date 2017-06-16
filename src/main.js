import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import $ from 'jquery';
import SelectArea from 'leaflet-area-select';
import {drawHeatmap} from './heatmap';
import {drawParaCoords} from './paracoordinates';

//base map layer
const baseLayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png');

//canvas of heat map
const canvas = document.createElement('canvas');
canvas.id = 'heat';
canvas.width = window.innerWidth/2;
canvas.height = window.innerHeight/2;
canvas.style.transition = 'opacity 0.2s';
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

//canvas for rect-area/boundary
const b_canvas = document.createElement('canvas');
b_canvas.id = 'rect-area';
b_canvas.width = window.innerWidth/2;
b_canvas.height = window.innerHeight/2;
b_canvas.style.transition = 'opacity 0.2s';
const b_ctx = b_canvas.getContext('2d');
document.body.appendChild(b_canvas);

//parameters
let target_latlon_index;
let top_corr_data = [];
let heat_corr_data = [];
let display_day = 1;  // the day to be displayed
//marker on map
//let marker;
//L.Icon.Default.imagePath = '../asset';


//map defination
const map = new L.Map('map', {
    center: new L.latLng(35, 136),
    zoom: 7,
    minZoom: 4,
    maxZoom: 12,
    layers: [baseLayer],
    attributionCon: false,
    selectArea: true
});

//map event
map.on('areaselected', e => {
    //console.log(e.bounds.toBBoxString());
});
map.on('movestart', () => {
    canvas.style.opacity = 0;
    b_ctx.clearRect(0, 0, b_canvas.width, b_canvas.height);
});
map.on('moveend', () => {
    drawHeatmap(heat_corr_data, target_latlon_index);
    canvas.style.opacity = 1;
});
map.on('zoomstart', () => {
    canvas.style.opacity  = 0;
    b_ctx.clearRect(0, 0, b_canvas.width, b_canvas.height);
});
map.on('zoomend', () => {
    drawHeatmap(heat_corr_data, target_latlon_index);
    canvas.style.opacity = 1;
});
map.on('popupopen', () => {
    $('#heat').css('z-index', -1);
    $('#rect-area').css('z-index', -2);
});
map.on('popupclose', () => {
    $('#heat').css('z-index', 1);
    $('#rect-area').css('z-index', 2);
});
map.on('click', e => {
    //set popup
    L.popup()
        .setLatLng(e.latlng)
        .setContent( e.latlng.toString() +
            '<button id="button-inbox">charts</button>')
        .openOn(map);
    //generate url
    const lat = Math.round(e.latlng.lat*5)/5;
    const lon = Math.round(e.latlng.lng*5)/5;
    const url = `http://0.0.0.0:5000/data/${lat}_${lon}`;
    // lat and lon info of selected area
    target_latlon_index = lat.toFixed(1) + '_' + lon.toFixed(1);
    //button in popup clicked event
    document.getElementById('button-inbox')
        .addEventListener('click', () => {
            //clean former operation
            map.closePopup();
            $('#paracoord').empty();
            $('#selected-latlon').empty();
            $('#compared-data').empty();
            $('#linechart').empty();
            //$('#sunburst').empty();
            //request
            requestToServer(url);
            //create day selector
            $('#selected-latlon').append(`<form id='selected-form'>You cliked at ${lat.toFixed(1)}&${lon.toFixed(1)}. Select date: <select id="days"></select></form>`);
            for(let i=1; i<=31; i++){
                $('#days').append(`<option value="${i}">${i}</option>`);
            }
            //create data type selector
            $('#compared-data').append('<form id="data-type-form">Select data: <select id="data-type"></select></form>');
            $('#data-type').append('<option value="rain">RAIN</option>');
            $('#data-type').append('<option value="cla">CLA</option>');
            $('#data-type').append('<option value="psurf">PSURF</option>');
            $('#data-type').append('<option value="tmp">TMP</option>');
        });
});

$('#selected-latlon').on('change', () => {
    display_day = $('#days').val();
    $('#paracoord').empty();
    drawParaCoords(top_corr_data, display_day, target_latlon_index);
});

const requestToServer = (url) => {
    axios.get(url)
    .then( (res) => {
        let data = res.data;
        top_corr_data = data['top_corr_data'];
        heat_corr_data = data['heat_corr_data'];
        drawHeatmap(heat_corr_data, target_latlon_index);
        drawParaCoords(top_corr_data, display_day, target_latlon_index);
    });
};

export {canvas, ctx, b_canvas, b_ctx, map};
