#!/bin/bash

screen -dmS tailwind /bin/bash -c "
tailwindcss -i ./css/main.css -o ./css/dist.css -w -m
"