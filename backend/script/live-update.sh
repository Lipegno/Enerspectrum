#!/bin/bash
if [ $(id -u) != 0 ]; then
   echo "This script requires root permissions"
   sudo "$0" "$@"
   exit
fi

source ./update_enlistment.sh
pushd /var/app/
kill -SIGHUP $(cat cluster_main.pid)
popd