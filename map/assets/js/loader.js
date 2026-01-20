// Load CSS dynamically
function loadCSS(href) {
  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.onload = resolve;
    link.onerror = reject;
    document.head.appendChild(link);
  });
}

// Load JS dynamically
function loadJS(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.type = "text/javascript";
    script.defer = false;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function loadModule(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.type = "module";      // 👈 IMPORTANT
    script.src = src;
    script.onload = () => resolve(src);
    script.onerror = () => reject(new Error(`Failed to load module: ${src}`));
    document.body.appendChild(script);
  });
}

function addDiv({
  parent = document.body,
  text = "",
  className = "",
  id = "",
  innerHTML=""
} = {}) {
  const div = document.createElement("div");

  if (text) div.textContent = text;
  if (className) div.className = className;
  if (id) div.id = id;
  if (innerHTML) div.innerHTML = innerHTML;

  parent.appendChild(div);
  return div;
}


const Router = {
  routes: {},

  add(path, handler) {
    this.routes[path] = handler;
  },

  go(path) {
    history.pushState({}, "", path);
    this.resolve();
  },

  start() {
    window.addEventListener("popstate", () => this.resolve());
    this.resolve();
  },

  resolve() {
      // const path = location.pathname;
    const path = location.hash.replace("#", "") || "/";
    this.routes[path]?.();
  },
};


export { loadCSS, loadJS, loadModule, addDiv, Router };