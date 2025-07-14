import html from './html/dashboard.html' with { type: 'text' };

import { Webview } from 'webview-bun';

const webview = new Webview(false, {
  height: 500,
  width: 800,
});
webview.onReady(() => {
    webview.title = "Bun App";
    webview.setHTML(html);
    webview.run();
    postMessage("exit");
})