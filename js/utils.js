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

export function format_string(string) {
  for (let i=1; i<arguments.length; i++) {
    let replacement = arguments[i];
    string = string.replace(`{${i-1}}`, replacement)
  }
  return string;
}

export function is_success(status) {
  return (status+"")[0] != 2
}

export function http_get(url, callback, args={}) {
  const defaults = {headers: [], method: "GET", payload: null};
  merge_args(defaults, args);
  
  //handle errors
  let actual_callback = function() {
    this.success = (this.status+"")[0] == "2";
    try {
      this.json = JSON.parse(this.responseText);
      if (!this.success) {
        let log_message = "";
        log_message += `Request to "${url}" failed with status ${this.status}.`;
        log_message += `\n${this.json.error}: ${this.json.message}`;
        if (typeof this.json.traceback != "undefined") {
          log_message += "\n"+this.json.traceback;
        }
        console.warn(log_message);
      }
      if (typeof this.json.session != "undefined") {
        api.set_session(this.json.session);
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