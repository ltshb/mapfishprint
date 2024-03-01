import test from 'node:test';
import assert from 'node:assert';
import Map from 'ol/Map.js';
import {MFPEncoder, BaseCustomizer} from './lib/index.js';
import TileLayer from 'ol/layer/Tile.js';
import OSM from 'ol/source/OSM.js';
import {View} from 'ol';
import {Polygon, LineString, Point, Circle} from 'ol/geom.js';
import {fromLonLat} from 'ol/proj.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import Feature from './demo/ol/Feature.js';
import {Fill, Stroke, Style, Text} from 'ol/style.js';

const MFP_URL = 'https://geomapfish-demo-2-8.camptocamp.com/printproxy';

const getEmptyMap = () => {
  return new Map({
    target: 'map',
    view: new View({
      center: fromLonLat([7.1560911, 46.3521411]),
      zoom: 12,
    }),
  });
};

const getDefaultOptions = (map, customizer) => {
  return {
    map,
    scale: 1,
    printResolution: map.getView().getResolution(),
    dpi: 300,
    customizer,
  };
};

const fPolygon = new Feature({
  name: 'A polygon',
  geometry: new Polygon([
    [
      [796612, 5837460],
      [796812, 5837460],
      [796812, 5837260],
      [796612, 5837260],
      [796612, 5837460],
    ],
  ]),
});

const fLine = new Feature({
  name: 'A line',
  geometry: new LineString([
    [796712, 5836960],
    [796712, 5836760],
    [796812, 5836760],
  ]),
});

const fPoint = new Feature({
  name: 'A point',
  geometry: new Point([796612, 5836960]),
});

const fill = new Fill({color: 'rgba(100, 100, 100, 0.5)'});
const stroke = new Stroke({
  color: '#002288',
  width: 1.25,
});
const styleFn = (feature) => {
  return new Style({
    fill,
    stroke,
    text: new Text({
      text: feature.get('name'),
      font: '12px sans-serif',
      offsetY: 12,
    }),
    image: new Circle({
      fill,
      stroke: stroke,
      radius: 5,
    }),
  });
};

test('Empty map', async (t) => {
  const encoder = new MFPEncoder('./mfp_server_url');
  const customizer = new BaseCustomizer([0, 0, 1000, 1000]);
  const map = getEmptyMap();
  map.getView();
  const spec = await encoder.encodeMap(getDefaultOptions(map, customizer));
  assert.deepEqual(spec, {
    center: [796612.417322277, 5836960.776101627],
    dpi: 300,
    layers: [],
    projection: 'EPSG:3857',
    rotation: 0,
    scale: 1,
  });
});

test('OSM map', async (t) => {
  const map = getEmptyMap();
  map.addLayer(new TileLayer({source: new OSM()}));
  class MyMfpBaseEncoder extends MFPEncoder {}
  const encoder = new MyMfpBaseEncoder(MFP_URL);
  const customizer = new BaseCustomizer([0, 0, 10000, 10000]);
  const spec = await encoder.encodeMap(getDefaultOptions(map, customizer));

  assert.deepEqual(spec, {
    center: [796612.417322277, 5836960.776101627],
    dpi: 300,
    layers: [
      {
        baseURL: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        name: undefined,
        opacity: 1,
        type: 'osm',
      },
    ],
    projection: 'EPSG:3857',
    rotation: 0,
    scale: 1,
  });
});

test('Vector features', async (t) => {
  const map = getEmptyMap();
  const encoder = new MFPEncoder('./mfp_server_url');
  const customizer = new BaseCustomizer([0, 0, Infinity, Infinity]);
  const features = [fPolygon, fLine, fPoint];
  features.forEach((feature) => feature.setStyle(styleFn));
  map.getView();
  map.addLayer(
    new VectorLayer({
      source: new VectorSource({
        features,
      }),
    }),
  );
  const spec = await encoder.encodeMap(getDefaultOptions(map, customizer));
  assert.deepEqual(spec, {
    center: [796612.417322277, 5836960.776101627],
    dpi: 300,
    layers: [
      {
        geoJson: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [
                    [796612, 5837460],
                    [796812, 5837460],
                    [796812, 5837260],
                    [796612, 5837260],
                    [796612, 5837460],
                  ],
                ],
              },
              properties: {
                name: 'A polygon',
                _gmfp_style: '1',
              },
            },
            {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: [
                  [796712, 5836960],
                  [796712, 5836760],
                  [796812, 5836760],
                ],
              },
              properties: {
                name: 'A line',
                _gmfp_style: '2',
              },
            },
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [796612, 5836960],
              },
              properties: {
                name: 'A point',
                _gmfp_style: '3',
              },
            },
          ],
        },
        name: undefined,
        opacity: 1,
        style: {
          version: 2,
          "[_gmfp_style = '1']": {
            symbolizers: [
              {
                type: 'polygon',
                fillColor: '#646464',
                fillOpacity: 0.5,
                strokeColor: '#002288',
                strokeOpacity: 1,
                strokeWidth: 1.25,
              },
              {
                type: 'text',
                label: 'A polygon',
                fontFamily: '12px sans-serif',
                labelXOffset: 0,
                labelYOffset: 12,
                labelAlign: 'cm',
                fillColor: '#333333',
                fillOpacity: 1,
                fontColor: '#333333',
              },
            ],
          },
          "[_gmfp_style = '2']": {
            symbolizers: [
              {
                type: 'line',
                strokeColor: '#002288',
                strokeOpacity: 1,
                strokeWidth: 1.25,
              },
              {
                type: 'text',
                label: 'A line',
                fontFamily: '12px sans-serif',
                labelXOffset: 0,
                labelYOffset: 12,
                labelAlign: 'cm',
                fillColor: '#333333',
                fillOpacity: 1,
                fontColor: '#333333',
              },
            ],
          },
          "[_gmfp_style = '3']": {
            symbolizers: [
              {
                type: 'text',
                label: 'A point',
                fontFamily: '12px sans-serif',
                labelXOffset: 0,
                labelYOffset: 12,
                labelAlign: 'cm',
                fillColor: '#333333',
                fillOpacity: 1,
                fontColor: '#333333',
              },
            ],
          },
        },
        type: 'geojson',
      },
    ],
    projection: 'EPSG:3857',
    rotation: 0,
    scale: 1,
  });
});
