![Logo](https://raw.githubusercontent.com/ading2210/openq/main/assets/banner.svg)

OpenQ is an open source frontend for [Q Student Connection](https://www.myaequitas.com/products.html#content9-p). 

## Features:

Currently, OpenQ is able to:
 - Login
 - List and display students
 - List courses and grades

Since OpenQ is in early development, the current feature set is very incomplete.

## Running:

To run this project for yourself, follow these steps:
1. Clone this repository.
2. Install the needed dependancies by running `pip3 install -r requirements.txt`.
3. Copy `config/defaults.json` to `config/config.json` and modify the options to your liking. Make sure to set the `"endpoint"`option to the url of your Q instance's login screen.
4. Run `tailwindcss -i ./css/main.css -o ./css/dist.css -m` to generate the site's CSS.
5. Run `python3 main.py` to start the server.
6. Alternatively, install GNU Screen on your system and run `bash scripts/start.sh`. You can then use `screen -dr webserver` to view the server log.

## Configuration Options:

The config file is located at `config/config.json`. If it doesn't exist, it'll be created automatically.
```
{
  "debug": false, //run flask in debug mode and include stacktraces in error responses
  "server_port": 5000, //http server port
  "server_address": "0.0.0.0", //http server bind address
  "default_endpoint": null, //default q endpoint to use
  "gzip_level": 9 //gzip compression level for json responses (false to disable)
  "indent_json": false //apply indent to json responses (set to an integer to enable, false to disable)
}
```

## API Documentation:

OpenQ provides an HTTP API which makes interfacing with Q significantly easier.

Once the API is complete, proper documentation will be placed here. In the meantime, look at the API related code in `main.py` to get an idea on how it works.

## Credits:

Icons credit: [Iconoir](https://iconoir.com/) ([license](https://github.com/iconoir-icons/iconoir/blob/main/LICENSE))

Font credit: [Fredoka](https://fonts.google.com/specimen/Fredoka) ([license](https://fonts.google.com/specimen/Fredoka/about))

This project uses pytailwindcss ([license](https://github.com/timonweb/pytailwindcss/blob/main/LICENSE)), Flask ([license](https://flask.palletsprojects.com/en/2.2.x/license/)), and lxml ([license](https://github.com/lxml/lxml/blob/master/LICENSES.txt)). 

## License:

This prject is licensed under the [GNU GPL v3](https://github.com/ading2210/openq/blob/main/LICENSE).