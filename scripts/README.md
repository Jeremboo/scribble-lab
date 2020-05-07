# Scribble Lab

Based on canvas-sketch tool

## Start dev env' on a specific day

`npm start`

## Create a new Group

`npm run create:group`

## Create a new Sketch

`npm run create:scribble`

## Update the main README.md

## Build a external file

# TODO

- Make all old scribbles works
- Replace glslify by strings
- Remove folders without app.js included
- Fix script/build.js to export images too
- Avoid asset duplication per project (external URL from the github repo?)
- Add prettier auto update
- Add "latest" option when you get a scribble
- Replace the postprocessing package by an handmade one
- Remove all duplicate files
- babel: Make arrow function into class working
- babel: Make decorator works
- Make a script to export a gif to mp4 (based on canvas-sketch-mp4)
- Create unit tests to easily debug the scripts.
- Remove useless sketches


# QUESTION - ISSUES

- canvas-sketch: Documentation can include all variables you can inject into the html template (like {{title}})
- canvas-sketch: issue with --stream [ gif --size:512:-1 ]