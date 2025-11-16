import html from '../html/dashboard.html' with {type: 'text'};
import css from '../html/css/index.css' with {type: 'text'};
import js from '../html/js/communication.js' with {type: 'text' };
function buildHTML() {
    return html
        .replace('<link rel="stylesheet" href="css/index.css">', `<style>${css}</style>`)
        .replace('<script src="js/communication.js"></script>', `<script>${js}</script>`);
}
export default buildHTML()
