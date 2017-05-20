import {canvas, ctx, map} from './main';

export const drawHeatmap = (heat_corr_data, target_latlon_index) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    heat_corr_data.forEach( d => {
        let latlon = d[0].split('_');
        const nw = map.latLngToContainerPoint([+latlon[0]-0.1, +latlon[1]+0.1]);
        const se = map.latLngToContainerPoint([+latlon[0]+0.1, +latlon[1]-0.1]);
        ctx.fillStyle = `hsla(${(1-d[1])*150}, 50%, 80%, ${d[1] / 2 + 0.3})`;
        ctx.fillRect(nw.x, nw.y, se.x-nw.x, se.y-nw.y);
    });
    const marker = new Image();
    marker.src = '../asset/marker-icon-2x.png';
    const latlon = target_latlon_index.split('_');
    const xy = map.latLngToContainerPoint([+latlon[0], +latlon[1]]);
    const marker_width = map.getZoom()/0.41;
    const marker_height = map.getZoom()/0.25;
    marker.onload = () => {
        ctx.drawImage(marker, xy.x-marker_width/2, xy.y-marker_height, marker_width, marker_height);
    };
};
