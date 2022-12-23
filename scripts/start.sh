#!/bin/bash

screen -dmS webserver /bin/bash -c "
while true
do
  python3 main.py
  echo 'Program exited. Press CTR+C in the next 5 seconds to exit.'
  sleep 5
  echo 'Relaunching...'
done
"