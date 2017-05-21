import d3 from 'd3';
import axios from 'axios';
import $ from 'jquery';
import {b_canvas, b_ctx, map} from './main';
import {drawLineChart} from './linechart';


// [ lat_lon: [ttd:[], clh:[], cll:[], clm:[], cla:[], tpw:[],
//             rain:[], psurf[], tmp:[]] ]
const processData = (raw_data, display_day, target_latlon_index) => {
    const day = display_day - 1;
    let all_data = [];  // array
    let target_data;  // dict data of selectd area and will be displayed in red
    raw_data.forEach( d =>{
        //require data formed as [[lat_lon,[[cll0, cll1, cll2,...],[clm0,...clm30],[] ], ...]
        let temp_data = {'lat&lng': d[0], 'cla': d[1]['cla'][day], 'rain': d[1]['rain'][day],
            'psurf': d[1]['psurf'][day], 'tmp': d[1]['tmp'][day]};
        all_data.push(temp_data);
        if(d[0] == target_latlon_index){
            target_data = {'lat&lng': d[0], 'cla': d[1]['cla'][day], 'rain': d[1]['rain'][day],
                'psurf': d[1]['psurf'][day], 'tmp': d[1]['tmp'][day]};
        }
    });
    let data = {'target_data': target_data, 'all_data': all_data};
    return data;
};

const requestForHourlyData = (target_latlon_index, compared_latlon_index) => {
    const datatype = $('#data-type').val();
    const url = `http://0.0.0.0:5000/hourly/${datatype}|${target_latlon_index}|${compared_latlon_index}`;
    axios.get(url)
    .then( res => {
        const data = res.data;
        $('#linechart').empty();
        drawLineChart(data);
    });
};

export const drawParaCoords = (raw_data, display_day, target_latlon_index) => {
    //reform data
    const processed_data = processData(raw_data, display_day, target_latlon_index);
    const data = processed_data['all_data'];  // array
    const target_data = processed_data['target_data'];  // dict


    const margin = {top: 30, right: 40, bottom: 20, left: 80},
        width = window.innerWidth/2 - margin.left - margin.right,
        height = window.innerHeight*9/20 - margin.top - margin.bottom;
    const dimensions = [
        {
            name: 'lat&lng',
            scale: d3.scale.ordinal().rangePoints([0, height]),
            type: String
        },
        {
            name: 'rain',
            scale: d3.scale.linear().range([0, height]),
            type: Number
        },
        {
            name: 'cla',
            scale: d3.scale.linear().range([height, 0]),
            type: Number
        },
        {
            name: 'psurf',
            scale: d3.scale.linear().range([height, 0]),
            type: Number
        },
        {
            name: 'tmp',
            scale: d3.scale.linear().range([height, 0]),
            type: Number
        }
    ];

    const x = d3.scale.ordinal()
            .domain(dimensions.map(function(d) { return d.name; }))
            .rangePoints([0, width]);

    const line = d3.svg.line()
            .defined(function(d) { return !isNaN(d[1]); });

    const yAxis = d3.svg.axis()
            .orient('left');

    const svg = d3.select('#paracoord').append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
        .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    const dimension = svg.selectAll('.dimension')
            .data(dimensions)
        .enter().append('g')
            .attr('class', 'dimension')
            .attr('transform', function(d) {return 'translate(' + x(d.name) + ')'; });

    dimensions.forEach(function(dimension){
        dimension.scale.domain(dimension.type === Number
            ? d3.extent(data, function(d) { return +d[dimension.name]; })
            : data.map(function(d) { return d[dimension.name]; }).reverse());
    });

    svg.append('g')
            .attr('class', 'background')
        .selectAll('path')
            .data(data)
        .enter().append('path')
            .attr('d', draw);
    svg.append('g')
            .attr('class', 'foreground')
        .selectAll('path')
            .data(data)
        .enter().append('path')
            .attr('d', draw);

    svg.append('g')
            .attr('class', 'selected')
        .selectAll('path')
            .data([target_data])
        .enter().append('path')
            .attr('d', draw);


    dimension.append('g')
            .attr('class', 'axis')
            .each(function(d){d3.select(this).call(yAxis.scale(d.scale)); })
        .append('text')
            .attr('class', 'title')
            .attr('text-anchor', 'middle')
            .attr('y', -9)
            .text(function(d) { return d.name; });
    //mouse click
    svg.select('.axis').selectAll('text:not(.title)')
            .attr('class', 'label')
            .data(data, function(d){
                return d['lat&lng'] || d;
            });

    const projection = svg.selectAll('.axis text,.background path,.foreground path')
            .on('click', mouseclick);

    $('svg').click( function(e){
        if(e.target == this){
            mouseout();
        }
    });

    function mouseclick(d){
        svg.classed('active', true);
        projection.classed('inactive', function(p){ return p !== d; });
        projection.filter(function(p){ return p===d; }).each(moveToFront);
        interactWithMap(d);
        //prepare to drawing line chart for hourly data
        requestForHourlyData(target_latlon_index, d['lat&lng']);
    }

    function mouseout(){
        svg.classed('active', false);
        projection.classed('inactive', false);
    }

    function moveToFront(){
        this.parentNode.appendChild(this);
    }

    function draw(d){
        return line(dimensions.map(function(dimension){
            return [x(dimension.name), dimension.scale(d[dimension.name])];
        }));
    }

    const interactWithMap = (d) => {
        if(typeof(d) === 'object'){
            b_ctx.clearRect(0, 0, b_canvas.width, b_canvas.height);
            b_ctx.beginPath();
            const latlon = d['lat&lng'].split('_');
            const nw = map.latLngToContainerPoint([+latlon[0]-0.1, +latlon[1]+0.1]);
            const se = map.latLngToContainerPoint([+latlon[0]+0.1, +latlon[1]-0.1]);
            b_ctx.fillStyle = 'black';
            b_ctx.rect(nw.x, nw.y, se.x-nw.x, se.y-nw.y);
            b_ctx.stroke();
        }
    };
};
