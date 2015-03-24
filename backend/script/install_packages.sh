#!/bin/bash
if [ $(id -u) != 0 ]; then
   echo "This script requires root permissions"
   sudo "$0" "$@"
   exit
fi

## Install mongodb: Need to add custom repository to get an up-to-date version
apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
echo "deb http://repo.mongodb.org/apt/ubuntu "$(lsb_release -sc)"/mongodb-org/3.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.0.list
apt-get update

apt-get install -y $(cat PACKAGES)

## Install redis--version on apt-get is out-of-date
mkdir temp
wget http://download.redis.io/redis-stable.tar.gz -O ./temp/redis.tar.gz
tar -xzf ./temp/redis.tar.gz
pushd ./temp/redis-stable/
make
make install
popd
rm -rf ./temp/
