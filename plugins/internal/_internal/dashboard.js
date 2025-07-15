/**
 * Workers still need to be included externally for reasons ...
 * We include the dependency but exclude the 
 */
import { SizeHint, Webview } from 'webview-bun';

const webview = new Webview(false, {
  width: 1128,
  height: 920,
  hint: SizeHint.NONE
});

console.log("starting at ", __filename);

webview.onReady(() => {
  webview.title = "Clawffee";
  webview.init(`
    if(window.location.href != "http://localhost:4444/internal/dashboard/") 
      window.location.href = "http://localhost:4444/internal/dashboard/"
  `);
  webview.navigate('http://localhost:4444/internal/dashboard/');
  webview.run();
  postMessage("exit");
})