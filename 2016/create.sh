#!/usr/bin/env bash

arr=(basic canvas webgl);

# Get path name
echo ${DIR};
# Detect if the dir  is exist
if [ -z ${DIR} ]; then
  echo "DIR is empty, please use the command DIR=[DIRNAME] npm run create";
  exit 1;
fi
# Detect if the name is not already used
if [ -d ${DIR} ]; then
  echo "The dir name already exist";
  exit 1;
fi
# Copy the template with the path name
cp -R 00_template/ ${DIR};
# Use the good js file and call app.js only
if [ -z ${TYPE} ]; then
  echo "" > ${DIR}/app.js;
else
  # Detect if the template is knowed
  if [[ "${arr[@]}" =~ "${TYPE}" ]]; then
    # Get template type
    cp ${DIR}/app.${TYPE}.js ${DIR}/app.js;
  else
    echo "" > ${DIR}/app.js;
  fi
fi
# Remove other js files.
for typeName in "${arr[@]}"
do
  rm ${DIR}/app.${typeName}.js;
done
