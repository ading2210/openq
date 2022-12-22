import requests, json, re
from modules import utils, exceptions

q_endpoints = {
  "login": "/Home/Login"
}

def debug_response(r):
  headers = dict(r.headers)
  try:
    content = r.json()
  except json.decoder.JSONDecodeError:
    content = r.text
    
  response = {
    "headers": dict(r.headers),
    "content": content,
    "status": r.status_code
  }
  return response

def login(endpoint, username, password):
  url = endpoint + q_endpoints["login"]
  payload = {
    "Pin": username,
    "Password": password
  }
  r = requests.post(url, data=payload)
  data = r.json()
  
  if data["valid"] == "1":
    cookie_regex = r"ASP\.NET_SessionId=([^;]+)"
    cookie = r.headers.get("set-cookie")
    if cookie == None:
      raise KeyError("No cookie returned.")
      
    matches = re.findall(cookie_regex, cookie)
    if len(matches) == 0:
      raise KeyError("SessionId not present in resposne.")
    
    sessionId = matches[0]
    return sessionId

    return debug_response(r)
  else:
    raise exceptions.ForbiddenError("Username/Password is invalid.")
