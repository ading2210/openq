import base64, json, binascii, traceback, logging
from modules import exceptions

def load_config(base_path):
  pass

#generate a flask response from data
def generate_response(data, status=200):
  response = {
    "status": status,
    "data": data
  }
  return response, status

#convert an exception into a flask response
def handle_exception(exception, debug=False):
  exception_dict = {
    "TypeError": 400,
    "KeyError": 400,
    "UnauthorizedError": 401,
    "ForbiddenError": 403
  }
  
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
      raise TypeError("Invaid auth header data.")
    
    if "endpoint" in data:
      for key in data:
        if not key in ["endpoint", "session", "username", "password"]:
          del data[key]
      
      if "session" in data:
        return data
      elif "username" in data and "password" in data:
        return data
      else:
        raise exceptions.UnauthorizedError("Session or login missing.")

    else:
      raise KeyError("Endpoint url missing.")
      
  else:
    raise exceptions.UnauthorizedError("Auth header missing.")