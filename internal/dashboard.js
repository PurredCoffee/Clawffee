import html from './html/dashboard.html' with { type: 'text' };
import css from './html/css/index.css' with { type: 'text' };
import js from '../html/js/communication.js' with { type: 'text' };

import { SizeHint, Webview } from 'webview-bun';



const webview = new Webview(false, {
  width: 1128,
  height: 920
});
webview.onReady(() => {
    webview.title = "Clawffee";
    webview.setHTML(
      html
      .replace('<link rel="stylesheet" href="css/index.css">', `<style>${css}</style>`)
      .replace('<script src="js/communication.js"></script>', `<script>${js}</script>`)
    );
    webview.run();
    postMessage("exit");
})