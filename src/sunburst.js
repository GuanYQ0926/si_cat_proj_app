import d3 from 'd3';
import $ from 'jquery';

export const drawSunburst = () => {
    const width = window.innerWidth / 2,
        height = window.innerHeight / 2,
        radius = Math.min(width, height) / 2.25;

    const x = d3.scale.linear()
        .range([0, 2*Math.PI]);
    const y = d3.scale.sqrt()
        .range([0, radius]);

    const color = d3.scale.category20c();

    $('#sunburst').empty();
    const svg = d3.select('#sunburst').append('svg')
            .attr('width', width)
            .attr('height', height)
        .append('g')
            .attr('transform', `translate(${width/2},${height/2+10})`);

    const partition = d3.layout.partition()
            .sort(null)
            .value(() => {return 1;});

    const arc = d3.svg.arc()
            .startAngle(d => {return Math.max(0, Math.min(2*Math.PI, x(d.x)));})
            .endAngle(d => {return Math.max(0, Math.min(2*Math.PI, x(d.x+d.dx)));})
            .innerRadius(d => {return Math.max(0, y(d.y));})
            .outerRadius(d => {return Math.max(0, y(d.y+d.dy));});

    let node;

    d3.json('../src/flare.json', (error, root) => {
        node = root;
        console.log(root);
        const path = svg.datum(root).selectAll('path')
                .data(partition.nodes)
            .enter().append('path')
                .attr('d', arc)
                .style('fill', d => {return color((d.children?d:d.parent).name);})
                .on('click', click)
                .each(stash);
        d3.selectAll('input').on('change', function change(){
            const value = this.value === 'count'
                ? function() {return 1;}
                : function(d) {return d.size;};
            path
                .data(partition.value(value).nodes)
                .transition()
                .duration(1000)
                .attrTween('d', arcTweenData);
        });

        function click(d){
            node = d;
            path.transition()
                .duration(1000)
                .attrTween('d', arcTweenZoom(d));
        }
    });

    d3.select(self.frameElement).style('height', height+'px');
    //setup for switching data: stash the old values for transition
    function stash(d){
        d.x0 = d.x;
        d.dx0 = d.dx;
    }
    //when switching data: interpolate the arcs in data space.
    function arcTweenData(a, i){
        const oi = d3.interpolate({x: a.x0, dx: a.dx0}, a);
        function tween(t){
            const b = oi(t);
            a.x0 = b.x;
            a.dx0 = b.dx;
            return arc(b);
        }
        if(i===0){
            // If we are on the first arc, adjust the x domain to match the root node
            // at the current zoom level. (We only need to do this once.)
            const xd = d3.interpolate(x.domain(), [node.x, node.x+node.dx]);
            return function(t){
                x.domain(xd(t));
                return tween(t);
            };
        }
        else{
            return tween;
        }
    }
    //when zooming: interpolate the scales
    function arcTweenZoom(d){
        const xd = d3.interpolate(x.domain(), [d.x, d.x+d.dx]),
            yd = d3.interpolate(y.domain(), [d.y, 1]),
            yr = d3.interpolate(y.range(), [d.y?20:0, radius]);
        return function(d, i){
            return i
                ? function(){return arc(d);}
                : function(t){x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d);};
        };
    }
};
