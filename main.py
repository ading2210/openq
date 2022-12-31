from flask import Flask, render_template, send_from_directory, request
from flask_compress import Compress
from PIL import Image
from modules import api, utils, exceptions, datatypes
import pathlib
import base64
import time
import io

#===== load config =====
base_path = pathlib.Path(__file__).parent.resolve()
config_path = base_path / "config"
utils.load_config(config_path)
if utils.config["debug"]:
  print("Debug mode enabled. Stacktraces will be included in error responses.")

if utils.config["default_endpoint"] == None:
  raise Exception("Please set the default Q endpoint in config.json.")
  
#===== create flask instance =====

app = Flask(__name__)
app.json_encoder = datatypes.CustomJSONEncoder
if utils.config["gzip_level"] != False:
  Compress(app)
  app.config["COMPRESS_ALGORITHM"] = "gzip"
  app.config["COMPRESS_LEVEL"] = utils.config["gzip_level"]
  app.config["COMPRESS_MIMETYPES"].append("image/svg+xml")

#===== error pages =====

@app.errorhandler(404)
def hanle_404(e):
  return render_template("404.html"), 404
  
#===== api routes =====

def generic_api_route(request, api_method, *args, **kwargs):
  try:
    auth, headers = utils.extract_data(request)
    result = api_method(auth["endpoint"], auth["session"], *args, **kwargs)
    return utils.generate_response(result)
  except Exception as e:
    return utils.handle_exception(e)

@app.route("/api/default_endpoint", methods=["GET"])
def get_default_endpoint():
  try:
    response = {"endpoint": utils.config["default_endpoint"]}
    return utils.generate_response(response)
  except Exception as e:
    return utils.handle_exception(e)

@app.route("/api/login", methods=["POST"])
def login():
  try:
    auth, headers = utils.extract_data(request)
    if "cookie" in headers: del headers["cookie"]
    data = request.json
    
    if not "username" in data or not "password" in data:
      raise exceptions.BadRequestError("Username or password missing.")
    if data["username"] == "":
      raise exceptions.BadRequestError("Username cannot be empty.")
    if data["password"] == "":
      raise exceptions.BadRequestError("Password cannot be empty.")
    
    result = api.login(auth["endpoint"], data["username"], data["password"], headers=headers)
    response = {"success": True}
    return utils.generate_response(response, result.session)
  
  except Exception as e:
    return utils.handle_exception(e)

@app.route("/api/validate_session", methods=["GET", "HEAD"])
def validate_session():
  try:
    auth, headers = utils.extract_data(request)
    endpoint = auth["endpoint"]
    api.get_students(endpoint, auth["session"], headers=headers)
    
    if request.method == "GET":
      return utils.generate_response({"success": True})
    else:
      return "", 200, {"success": "true"}
      
  except Exception as e:
    if request.method == "GET":
      return utils.generate_response({"success": False})
    else:
      return "", 200, {"success": "false"}
      
@app.route("/api/students")
def get_students():
  try:
    auth, headers = utils.extract_data(request)
    endpoint = auth["endpoint"]
    
    result = api.get_students(endpoint, auth["session"], headers=headers)
    students = result.students
    if len(students) == 1:
      api.set_current_student(endpoint, auth["session"], students[0].id, headers=headers)
      students[0].active = True
    else:
      for student in students:
        student.active = False
    
    return utils.generate_response(result)
    
  except Exception as e:
    return utils.handle_exception(e)

@app.route("/api/set_student/<student_id>")
def set_student(student_id):
  return generic_api_route(request, api.set_current_student, q_id=student_id)

@app.route("/api/student_image")
@app.route("/api/student_image/<student_id>")
def get_student_image(student_id=None):
  try:
    auth, headers = utils.extract_data(request)
    endpoint = auth["endpoint"]
    session = auth["session"]
    
    #todo: don't use base64
    result = api.get_student_image(endpoint, session, student_id, headers=headers)
    
    #resize and compress image if applicable
    resized_size = request.args.get("size")
    if resized_size:
      resized_size = int(resized_size)
      img = Image.open(io.BytesIO(result.data))
      width, height = img.size
      
      #resize image
      if resized_size > max(height, width):
        raise exceptions.BadRequestError("Image size too large.")
      new_size = resized_size, resized_size
      img.thumbnail(new_size, Image.Resampling.LANCZOS)
      
      #strip exif data from iamge
      img_data = list(img.getdata())
      image_stripped = Image.new(img.mode, img.size)
      image_stripped.putdata(img_data)
      
      #compress image
      img_bytes = io.BytesIO()
      image_stripped.save(img_bytes, format="jpeg", optimize=True, quality=85)
      data = img_bytes.getvalue()
    else:
      data = result.data
    
    b64_data = base64.b64encode(data).decode()
    b64_string = f"data:{result.content_type};base64,{b64_data}"
    response = {
      "b64": b64_string,
      "timer": result.timer
    }
    
    response_headers = {
      "cache-control": "private, max-age=86400"
    }
    
    result.timer.update_finished()
    return utils.generate_response(response, headers=response_headers)
    
  except Exception as e:
    return utils.handle_exception(e)

@app.route("/api/assignments")
def get_asssignments():
  return generic_api_route(request, api.get_assignments)

@app.route("/api/courses")
def get_courses():
  return generic_api_route(request, api.get_assignments, courses_only=True)

@app.route("/api/demographics")
def get_demographics():
  return generic_api_route(request, api.get_demographics)

@app.route("/api/attendance")
def get_attendance():
  return generic_api_route(request, api.get_attendance)

#===== user-visible pages =====

@app.route("/")
def homepage():
  return render_template("index.html")

@app.route("/about")
def about():
  return render_template("about.html")

@app.route("/assignments")
def assignments():
  return render_template("assignments.html")

#not implemented yet
@app.route("/demographics")
def demographics():
  return render_template("demographics.html")

@app.route("/attendance")
def attendance():
  return render_template("attendance.html")

#===== assets and static files =====

@app.route("/js/<path:path>")
def js(path):
  return send_from_directory("js", path)
  
@app.route("/assets/<path:path>")
def assets(path):
  return send_from_directory("assets", path)

@app.route("/css/<path:path>")
def css(path):
  return send_from_directory("css", path)

#===== start server =====

if __name__ == "__main__":
  host = utils.config["server_address"]
  port = utils.config["server_port"]
  debug = utils.config["debug"]
  
  app.run(host=host, port=port, debug=debug)