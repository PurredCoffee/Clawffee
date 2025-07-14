import { Webview } from 'webview-bun';

const webview = new Webview(false, {
  width: 1128,
  height: 920
});

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