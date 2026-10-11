import { initializeHostedStorage } from './hostedStorage';
initializeHostedStorage().then(() => import('./assetIndex')).catch(error => {
  document.getElementById('root').textContent = `Unable to open the library: ${error.message}`;
});
