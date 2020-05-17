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

## Scribbles

- Clean utils files
- Clean modules
- Replace the postprocessing package by an handmade one

## Core

- On save GIF, show a popup
- On save GIF, optimize it directly and add it into data.json
- Make a script to export a gif to mp4 (based on canvas-sketch-mp4)
- Create unit tests to easily debug the scripts.
- Avoid asset duplication per project (external URL from the github repo?)

# QUESTION - ISSUES

- canvas-sketch: Documentation can include all variables you can inject into the html template (like {{title}})
- canvas-sketch: issue with --stream [ gif --size:512:-1 ]
- canvas-sketch-cli: add @babel/plugin-proposal-class-properties
- canvas-sketch-cli: allow decorators