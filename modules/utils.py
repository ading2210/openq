import base64, json, binascii, traceback, logging, os, gzip
from modules import exceptions, datatypes
from urllib.parse import urlparse
from flask import make_response, send_from_directory

config = {}
exception_dict = {
  "BadRequestError": 400,
  "UnauthorizedError": 401,
  "ForbiddenError": 403,
  "BadGatewayError": 502
}

#load config files
def load_config(config_path):
  global config
  
  defaults_file = config_path / "defaults.json"
  config_file = config_path / "config.json"
  overwrite_config = False
  
  with open(defaults_file) as f:
    defaults = json.loads(f.read())
  
  if defaults_file.exists():
    try:
      with open(config_file) as f:
        config = json.loads(f.read())
    except json.decoder.JSONDecodeError:
      pass
  
  for key in defaults:
    if not key in config:
      config[key] = defaults[key]

  with open(config_file, "w") as f:
    f.write(json.dumps(config, indent=2))

#check if url is valid or not
def validate_url(url):
  result = urlparse(url)
  return all([result.scheme, result.netloc, result.path])

#generate a flask response from json data
def generate_response(data, session=None, status=200, headers={}, gzip_level=None):
  response_data = {
    "status": status,
    "data": data
  }
  if session != None:
    response_data["session"] = session
  
  if gzip_level == None:
    gzip_level = config["gzip_level"]

  if gzip_level == False:
    content = response_data
  else:
    if config["indent_json"] != False:
      indent = config["indent_json"]
      content_uncompressed = json.dumps(response_data, indent=indent, cls=datatypes.CustomJSONEncoder)
    else:
      content_uncompressed = json.dumps(response_data, cls=datatypes.CustomJSONEncoder)
    content = gzip.compress(content_uncompressed.encode('utf8'), gzip_level)
    headers["content-length"] = len(content)
    headers["content-encoding"] = "gzip"
    headers["content-type"] = "application/json"
    headers["original-length"] = len(content_uncompressed)
  
  response = make_response(content)
  response.status_code = status
  for key in headers:
    response.headers[key] = headers[key]
    
  return response

#convert an exception into a flask response
def handle_exception(exception, debug=None):
  if debug == None:
    debug = config.get("debug")
  
  if isinstance(exception, Exception):
    message = str(exception)
    exception_type = exception.__class__.__name__
    if exception_type in exception_dict:
      status = exception_dict[exception_type]
    else:
      status = 500

    response = {
      "error": exception_type,
      "status": status,
      "message": message
    }
    if debug:
      response["traceback"] = "".join(traceback.format_tb(exception.__traceback__))
    
    return response, status
    
  else:
    return {
      "error": "Unknown",
      "status": 500
    }, 500

#process auth header and raise the appropriate exception
def process_header(request):
  header = request.headers.get("authorization");
  
  if header:
    try:
      data = json.loads(base64.b64decode(header))
    except (json.decoder.JSONDecodeError, binascii.Error) as e: 
      raise exceptions.BadRequestError("Invaid auth header data.")
      
    if "endpoint" in data and "session" in data:
      returned = {
        "endpoint": data["endpoint"],
        "session": data["session"]
      }
      return returned
    else:
      raise exceptions.BadRequestError("Endpoint url missing.")
      
  else:
    raise exceptions.UnauthorizedError("Auth header missing.")

#validate headers
def validate_headers(request):
  auth = process_header(request)

  if not validate_url(auth["endpoint"]):
    raise exceptions.BadRequestError("Endpoint needs to be a valid URL.")

  return auth

#extract headers and auth data from a flask request
def extract_data(request):
  auth = validate_headers(request)
  
  headers = {}
  if request.headers.get("user-agent"):
    headers["user-agent"] = request.headers["user-agent"]

  return auth, headers