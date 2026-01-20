import { loadJS, loadCSS, loadModule ,addDiv,Router} from "./loader.js";

Router.add("/maps", () => initMap());

Router.add("/kml", () => {
//   initMap();
//   openKMLPanel();
});

Router.add("/map/draw", () => {
//   initMap();
//   enableDrawing();
 });