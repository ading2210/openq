import * as utils from "/js/utils.js"

export var q_endpoint = "";
export var session = "";
export const api_endpoints = {
  default_endpoint: "/api/default_endpoint",
  login: "/api/login",
  validate_session: "/api/validate_session",
  students: "/api/students",
  assignments: "/api/assignments"
};

export function set_q_endpoint(new_endpoint) {
  q_endpoint = new_endpoint;
}
export function set_session(new_session) {
  session = new_session;
}
export function retrieve_default_endpoint(debug=false) {
  let callback = function(r) {
    let response = JSON.parse(r.responseText);
    let endpoint = response.data.endpoint;
    if (debug) {console.log(`Setting endpoint to ${endpoint}`)}
    window.localStorage.setItem("q_endpoint", endpoint);
    set_q_endpoint(endpoint);
  };
  utils.http_get(api_endpoints.default_endpoint, callback);
}

export function encode_headers(overrides={}){
  let payload = {
    endpoint: q_endpoint,
    session: session
  };
  Object.assign(payload, overrides);
  return {"authorization": window.btoa(JSON.stringify(payload))};
}

export function load_session() {
  if (window.localStorage.getItem("session") != null) {
    session = window.localStorage.getItem("session");
    console.log(`Loading session from localStorage.`);
    return session;
  }
  return null;
}

export function load_q_endpoint() {
  if (window.localStorage.getItem("q_endpoint") != null) {
    q_endpoint = window.localStorage.getItem("q_endpoint");
    console.log(`Loaded Q endpoint from localStorage: ${q_endpoint}`);
    return q_endpoint;
  }
  return null;
}

export function login(username, password, callback) {
  let url = api_endpoints.login;
  let payload = {
    username: username,
    password: password
  };
  utils.http_get(url, callback, {method: "POST", payload: payload, headers: encode_headers()});
}

export function validate_session(callback) {
  let url = api_endpoints.validate_session;
  utils.http_get(url, callback, {method: "HEAD", headers: encode_headers()});
}

export function get_students(callback) {
  let url = api_endpoints.students;
  utils.http_get(url, callback, {headers: encode_headers()});
}

export function get_assignments(callback) {
  let url = api_endpoints.students;
  utils.http_get(url, callback, {headers: encode_headers()});
}