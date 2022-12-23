import requests, json, re
from defusedxml import minidom
from modules import utils, exceptions

q_endpoints = {
  "login": "/Home/Login",
  "assignments": "/Home/LoadProfileData/Assignments"
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

#returns the session id after logging in
def login(endpoint, username, password, headers={}):
  url = endpoint + q_endpoints["login"]
  payload = {
    "Pin": username,
    "Password": password
  }
  r = requests.post(url, data=payload, headers=headers)
  data = r.json()
  
  if data["valid"] == "1":
    cookie_regex = r"ASP\.NET_SessionId=([^;]+)"
    cookie = r.headers.get("set-cookie")
    if cookie == None:
      raise exceptions.BadGatewayError("No cookie returned.")
      
    matches = re.findall(cookie_regex, cookie)
    if len(matches) == 0:
      raise exceptions.BadGatewayError("SessionId not present in resposne.")
    
    sessionId = matches[0]
    return sessionId
    
  else:
    raise exceptions.ForbiddenError("Username/Password is invalid.")

def get_assignments(endpoint, session, headers={}):
  url = endpoint + q_endpoint["assignments"]
  r = requests.get(url, headers=headers)
  document = mindom.parseString(r.text)
  print(document)