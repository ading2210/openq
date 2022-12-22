#!/bin/bash

#screen -dmS webserver tiny-http-server --bind 0.0.0.0 --port 5000 --auth user:fortniteballz
#screen -dmS webserver python3 main.py

screen -dmS webserver /bin/bash -c "
while true
do
  python3 main.py
  echo 'Program exited. Press CTR+C in the next 5 seconds to exit.'
  sleep 5
  echo 'Relaunching...'
done
"