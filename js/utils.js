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
  const defaults = {headers: [], method: "GET", payload: null};
  merge_args(defaults, args);
  
  //stringify payload
  var payload = args.payload;
  if (payload != null) {
    payload = JSON.stringify(args.payload);
    args.headers["content-type"] = "application/json";
  }
  
  //initiate request
  let request = new XMLHttpRequest();
  request.addEventListener("load", callback);
  request.open(args.method, url, true);
  
  //parse headers
  let keys = Object.keys(args.headers)
  for (let key of keys) {
    request.setRequestHeader(key, args.headers[key]);
  }
  
  request.send(payload);
}