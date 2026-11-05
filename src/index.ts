import * as xb from 'xrblocks';
import { SpatialAppConfigurator3D } from './SpatialAppConfigurator3D';

document.addEventListener('DOMContentLoaded', async () => {
  const options = new xb.Options();
  options.setAppTitle('ARTIFICIALCRAFT.SPACE · 3D Spatial Tunnel');
  options.setAppDescription(
    'Cybernetic Swiss 3D Tunnel Fly-Through, Radial Dispersion & Interactive Line-Branching Directory Tree'
  );
  options.reticles.enabled = true;

  const configurator = new SpatialAppConfigurator3D();
  xb.add(configurator);
  await xb.init(options);
});
