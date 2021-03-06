import d3 from 'd3';


const pad = d => {
    return (d < 10) ? '0' + d.toString() : d.toString();
};

const processData = (d, datatype) => {
    let data = [];
    if(datatype == 'tmp'){
        for(let i=0;i<d[0].length;i++){
            const temp_date = '201108'+pad(parseInt(i/24)+1)+pad(i%24);
            const temp_dict = {'date': temp_date, 'target':d[0][i]-273.15+'', 'compared':d[1][i]-273.15+''};
            data.push(temp_dict);
        }
    }
    else{
        for(let i=0;i<d[0].length;i++){
            const temp_date = '201108'+pad(parseInt(i/24)+1)+pad(i%24);
            const temp_dict = {'date': temp_date, 'target':d[0][i]+'', 'compared':d[1][i]+''};
            data.push(temp_dict);
        }
    }
    return data;
};

export const drawLineChart = (d, datatype) => {

    var margin = {top: 10, right: 10, bottom: 100, left: 40},
        margin2 = {top: 300, right: 10, bottom: 20, left: 40},
        width = window.innerWidth - margin.left - margin.right,
        height = 360 - margin.top - margin.bottom,
        height2 = 360 - margin2.top - margin2.bottom;

    var color = d3.scale.ordinal()
            .range(['#FA8072', '#4682b4']);//d3.scale.category10();

    var parseDate = d3.time.format('%Y%m%d%H').parse;

    var x = d3.time.scale().range([0, width]),
        x2 = d3.time.scale().range([0, width]),
        y = d3.scale.linear().range([height, 0]),
        y2 = d3.scale.linear().range([height2, 0]);

    var xAxis = d3.svg.axis().scale(x).orient('bottom'),
        xAxis2 = d3.svg.axis().scale(x2).orient('bottom'),
        yAxis = d3.svg.axis().scale(y).orient('left');

    var brush = d3.svg.brush()
        .x(x2)
        .on('brush', brush);

    var line = d3.svg.line()
        .defined(function(d) { return !isNaN(d.temperature); })
        .interpolate('cubic')
        .x(function(d) { return x(d.date); })
        .y(function(d) { return y(d.temperature); });

    var line2 = d3.svg.line()
        .defined(function(d) { return !isNaN(d.temperature); })
        .interpolate('cubic')
        .x(function(d) {return x2(d.date); })
        .y(function(d) {return y2(d.temperature); });

    var svg = d3.select('#linechart').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

    svg.append('defs').append('clipPath')
        .attr('id', 'clip')
      .append('rect')
        .attr('width', width)
        .attr('height', height);

    var focus = svg.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var context = svg.append('g')
      .attr('transform', 'translate(' + margin2.left + ',' + margin2.top + ')');


    const data = processData(d, datatype);

    color.domain(d3.keys(data[0]).filter(function(key) { return key !== 'date'; }));

    data.forEach(function(d) {
        d.date = parseDate(d.date);
    });

    var sources = color.domain().map(function(name) {
        return {
            name: name,
            values: data.map(function(d) {
                return {date: d.date, temperature: +d[name]};
            })
        };
    });

    x.domain(d3.extent(data, function(d) { return d.date; }));
    y.domain([d3.min(sources, function(c) { return d3.min(c.values, function(v) { return v.temperature; }); }),
        d3.max(sources, function(c) { return d3.max(c.values, function(v) { return v.temperature; }); }) ]);
    x2.domain(x.domain());
    y2.domain(y.domain());

    var focuslineGroups = focus.selectAll('g')
        .data(sources)
      .enter().append('g');

    var focuslines = focuslineGroups.append('path')
        .attr('class','line')
        .attr('d', function(d) { return line(d.values); })
        .style('stroke', function(d) {return color(d.name);})
        .attr('clip-path', 'url(#clip)');

    focus.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis);

    focus.append('g')
        .attr('class', 'y axis')
        .call(yAxis);

    if(datatype == 'rain'){
        focus.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 6)
            .attr('dy', '.71em')
            .style('text-anchor', 'end')
            .text('Precipitation (mm)');
    }
    else if(datatype == 'cla'){
        focus.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 6)
            .attr('dy', '.71em')
            .style('text-anchor', 'end')
            .text('Total cloud cover');
    }
    else if(datatype == 'psurf'){
        focus.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 6)
            .attr('dy', '.71em')
            .style('text-anchor', 'end')
            .text('Surface pressure (Pa)');
    }
    else{
        focus.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 6)
            .attr('dy', '.71em')
            .style('text-anchor', 'end')
            .text('Temperature (ºC)');
    }

    var contextlineGroups = context.selectAll('g')
        .data(sources)
      .enter().append('g');

    var contextLines = contextlineGroups.append('path')
        .attr('class', 'line')
        .attr('d', function(d) { return line2(d.values); })
        .style('stroke', function(d) {return color(d.name);})
        .attr('clip-path', 'url(#clip)');

    context.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height2 + ')')
        .call(xAxis2);

    context.append('g')
        .attr('class', 'x brush')
        .call(brush)
      .selectAll('rect')
        .attr('y', -6)
        .attr('height', height2 + 7);



    function brush() {
        x.domain(brush.empty() ? x2.domain() : brush.extent());
        focus.selectAll('path.line').attr('d',  function(d) {return line(d.values);});
        focus.select('.x.axis').call(xAxis);
        focus.select('.y.axis').call(yAxis);
    }

};
