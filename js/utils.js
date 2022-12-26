import * as api from "/js/api.js"

export function merge_args(defaults, args) {
  let keys = Object.keys(defaults);
  for (let i=0; i<keys.length; i++) {
    let key = keys[i];
    if (typeof args[key] === "undefined") {
      args[key] = defaults[key];
    }
  }
  return args;
}

export function clear_obj(obj) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      delete obj[key];
    }
  }
}

export function http_get(url, callback, args={}) {
  const defaults = {headers: [], method: "GET", payload: null, debug: false};
  merge_args(defaults, args);
  
  //handle errors
  let actual_callback = function() {
    try {
      let data = JSON.parse(this.responseText);
      if ((this.status+"")[0] != 2 && args.debug) {
        let log_message = "";
        log_message += `Request to "${url}" failed with status ${this.status}.`;
        log_message += `\n${data.error}: ${data.message}`;
        if (typeof data.traceback != "undefined") {
          log_message += "\n"+data.traceback;
        }
        console.warn(log_message);
      }
      if (typeof data.session != "undefined") {
        api.set_session(data.session);
      }
    }
    catch (e) {}
    
    callback(this);
  };
  
  //stringify payload
  let payload = args.payload;
  if (payload != null) {
    payload = JSON.stringify(args.payload);
    args.headers["content-type"] = "application/json";
  }
  
  //initiate request
  let request = new XMLHttpRequest();
  request.addEventListener("load", actual_callback);
  request.open(args.method, url, true);
  
  //parse headers
  let keys = Object.keys(args.headers);
  for (let key of keys) {
    request.setRequestHeader(key, args.headers[key]);
  }
  
  request.send(payload);
}