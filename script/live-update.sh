#!/bin/bash
if [ $(id -u) != 0 ]; then
   echo "This script requires root permissions"
   sudo "$0" "$@"
   exit
fi
