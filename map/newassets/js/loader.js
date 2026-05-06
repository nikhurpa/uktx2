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
// function loadJS(src) {
//   return new Promise((resolve, reject) => {
//     const script = document.createElement("script");
//     script.src = src;
//     script.type = "text/javascript";
//     script.defer = false;
//     script.onload = resolve;
//     script.onerror = reject;
//     document.head.appendChild(script);
//   });
// }

async function loadJS(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    
    // The timestamp ensures the URL is unique every millisecond
    const timestamp = new Date().getTime();
    script.src = `${url}?cache_bust=${timestamp}`;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Script load error for ${url}`));
    
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
  innerHTML = "",
  after = null // Can be a selector string ".my-class" or an Element object
} = {}) {
  const div = document.createElement("div");

  if (text) div.textContent = text;
  if (className) div.className = className;
  if (id) div.id = id;
  if (innerHTML) div.innerHTML = innerHTML;

  // Logic to find the "after" element
  const afterElement = typeof after === "string" 
    ? document.querySelector(after) 
    : after;

  if (afterElement && afterElement.parentNode) {
    // If the 'after' element exists, insert right after it
    afterElement.insertAdjacentElement('afterend', div);
  } else {
    // Otherwise, append to the bottom of the parent
    parent.appendChild(div);
  }

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