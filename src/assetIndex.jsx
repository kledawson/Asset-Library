import './asset-library.css';
import { createRoot } from 'react-dom/client';
import AssetPreview from './AssetPreview';
import CogComparison from './CogBronzeComparison';
import ToolDetailComparison from './ToolDetailPreview';
// Transfer existing editor drafts once when entering from the previous shared app.
if(window.location.hash.startsWith('#editor-state=')) {
  try { const state=JSON.parse(decodeURIComponent(window.location.hash.slice(14)));
    for(const [key,value] of Object.entries(state.local)) if(localStorage.getItem(key)===null)localStorage.setItem(key,value);
    if(state.view && !sessionStorage.getItem('pocketWorkshop.assetView'))sessionStorage.setItem('pocketWorkshop.assetView',state.view);
  } catch {}
  window.history.replaceState(null,'',window.location.pathname);
}
document.title='Asset Library';
createRoot(document.getElementById('root')).render(new URLSearchParams(window.location.search).get('compare')==='cog'?<CogComparison/>:new URLSearchParams(window.location.search).get('compare')==='tools'?<ToolDetailComparison/>:<AssetPreview />);


