//===== module for interfacing with openq's api =====

import * as utils from "/js/modules/utils.js";

export var q_endpoint = "";
export var session = "";
export const api_endpoints = {
  default_endpoint: "/api/default_endpoint",
  login: "/api/login",
  validate_session: "/api/validate_session",
  students: "/api/students",
  assignments: "/api/assignments",
  student_image: "/api/student_image/{0}",
  student_image_alt: "/api/student_image",
  set_student: "/api/set_student/{0}",
  courses: "/api/courses",
  demographics: "/api/demographics",
  attendance: "/api/attendance"
};
export var server = "";

export function set_server(s) {
  server = s;
}
export function set_q_endpoint(new_endpoint) {
  q_endpoint = new_endpoint;
}
export function set_session(new_session) {
  session = new_session;
}
export function retrieve_default_endpoint(debug=false) {
  let callback = function(r) {
    let endpoint = r.json.data.endpoint;
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
    console.log(`Loaded session from localStorage.`);
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

export function logout() {
  window.localStorage.clear();
}

export function validate_session(callback) {
  let url = api_endpoints.validate_session;
  utils.http_get(url, callback, {method: "HEAD", headers: encode_headers()});
}

export function get_students(callback) {
  let url = api_endpoints.students;
  utils.http_get(url, callback, {headers: encode_headers()});
}

export function get_student_image(callback, args) {
  const defaults = {student_id: null, size: null};
  utils.merge_args(defaults, args);
  
  let url;
  if (args.student_id) {
    url = utils.format_string(api_endpoints.student_image, args.student_id);
  }
  else {
    url = api_endpoints.student_image_alt;
  }
  if (args.size != null) {
    url += `?size=${args.size}`;
  }
  utils.http_get(url, callback, {headers: encode_headers()});
}

export function set_student(student_id, callback) {
  let url = utils.format_string(api_endpoints.set_student, student_id);
  utils.http_get(url, callback, {headers: encode_headers()});
}

export function get_assignments(callback) {
  let url = api_endpoints.assignments;
  utils.http_get(url, callback, {headers: encode_headers()});
}

export function get_courses(callback) {
  let url = api_endpoints.courses;
  utils.http_get(url, callback, {headers: encode_headers()});
}

export function get_demographics(callback) {
  let url = api_endpoints.demographics;
  utils.http_get(url, callback, {headers: encode_headers()});
}

export function get_attendance(callback) {
  let url = api_endpoints.attendance;
  utils.http_get(url, callback, {headers: encode_headers()});
}