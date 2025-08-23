/**
 * Workers still need to be included externally for reasons ...
 */
import { SizeHint, Webview } from 'webview-bun';

const w = new Webview(false, {
  width: 1128,
  height: 920,
  hint: SizeHint.NONE
});

w.onReady(() => {
  w.title = "Clawffee";
  w.init(`
    if(window.location.href != "http://localhost:4444/internal/dashboard/") 
      window.location.href = "http://localhost:4444/internal/dashboard/"
  `);
  w.navigate('http://localhost:4444/internal/dashboard/');
  w.run();
  postMessage("exit");
});