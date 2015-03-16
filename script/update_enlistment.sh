#!/bin/bash
pushd /var/app/
git pull $1
npm update
popd