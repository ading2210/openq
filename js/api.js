/* global btoa */

import * as utils from "/js/utils.js"

export var q_endpoint = "";
export var session = "";
export const api_endpoints = {
  login: "/api/login"
};

export function set_q_endpoint(new_endpoint) {
  q_endpoint = new_endpoint;
}
export function set_session(new_session) {
  session = new_session;
}

export function encode_headers(overrides={}){
  let payload = {
    endpoint: q_endpoint,
    session: session
  };
  Object.assign(payload, overrides);
  return {"authorization": btoa(JSON.stringify(payload))};
}

export function login(username, password, callback) {
  let url = api_endpoints.login;
  let payload = {
    username: username,
    password: password
  };
  utils.http_get(url, callback, {method: "POST", payload: payload, headers: encode_headers(payload)});
}