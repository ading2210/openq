from flask import Flask, render_template, send_from_directory, request
from modules import api, utils

app = Flask(__name__)

@app.route("/api/login", methods=["POST"])
def api_login():
  try:
    auth = utils.process_header(request)
    data = request.json
    endpoint = auth["endpoint"]
    
    if not "username" in data or not "password" in data:
      raise ValueError("Username or password missing.")
      
    sessionId = api.login(endpoint, data["username"], data["password"])
    response = {"session": sessionId}
    return utils.generate_response(response)
  
  except Exception as e:
    return utils.handle_exception(e, debug=True)
    
@app.route("/")
def homepage():
  return render_template("index.html")
  
@app.route("/js/<path:path>")
def js(path):
  return send_from_directory("js", path)
  
@app.route("/assets/<path:path>")
def assets(path):
  return send_from_directory("assets", path)

if __name__ == "__main__":
  app.run(host="0.0.0.0", port=5000, debug=True)