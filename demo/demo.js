import {Map, View} from 'ol';

import {
  MFPEncoder,
  BaseCustomizer,
  requestReport,
  getDownloadUrl,
  cancelPrint,
} from '@geoblocks/mapfishprint';
import TileLayer from 'ol/layer/Tile.js';
import OSM from 'ol/source/OSM.js';
import {fromLonLat} from 'ol/proj.js';

const MFP_URL = 'https://geomapfish-demo-2-8.camptocamp.com/printproxy';
const layout = '1 A4 portrait'; // better take from MFP
const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  view: new View({
    center: fromLonLat([7.1560911, 46.3521411]),
    zoom: 12,
  }),
});

let report = null;

document.querySelector('#cancel').addEventListener('click', async () => {
  console.log('Cancel print');
  if (report) {
    const cancelResult = await cancelPrint(MFP_URL, report.ref);
    if (cancelResult.status === 200) {
      console.log('Print is canceled');
    } else {
      console.log('Failed to cancel print');
    }
  } else {
    console.log('No print in progress');
  }
});

document.querySelector('#print').addEventListener('click', async () => {
  const specEl = document.querySelector('#spec');
  const reportEl = document.querySelector('#report');
  const resultEl = document.querySelector('#result');
  specEl.innerHTML = reportEl.innerHTML = resultEl.innerHTML = '';
  const encoder = new MFPEncoder(MFP_URL);
  const customizer = new BaseCustomizer([0, 0, 10000, 10000]);
  /**
   * @type {MFPMap}
   */
  const mapSpec = await encoder.encodeMap({
    map,
    scale: 10000,
    printResolution: map.getView().getResolution(),
    dpi: 254,
    customizer: customizer,
  });

  /**
   * @type {MFPSpec}
   */
  const spec = {
    attributes: {
      map: mapSpec,
      datasource: [],
    },
    format: 'pdf',
    layout: layout,
  };

  // This is just a quick demo
  // Note that using innerHTML is not a good idea in production code...

  console.log('spec', spec);
  specEl.innerHTML = JSON.stringify(spec, null, '  ');

  report = await requestReport(MFP_URL, spec);
  console.log('report', report);
  reportEl.innerHTML = JSON.stringify(report, null, '  ');

  await getDownloadUrl(MFP_URL, report, 1000)
    .then(
      (url) => {
        resultEl.innerHTML = url;
        document.location = url;
        return url;
      },
      (error) => {
        console.log('result', 'error', error);
        resultEl.innerHTML = error;
        return error;
      },
    )
    .finally(() => {
      report = null;
    });
});
