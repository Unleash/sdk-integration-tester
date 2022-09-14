#!/usr/bin/env bash
set -e
EDGE_BRANCH=${EDGE_BRANCH:-main}
EDGE_FOLDER=${EDGE_FOLDER:-unleash-on-the-edge}
if [ ! -d ${EDGE_FOLDER} ]; then
    git clone --depth 1 --branch ${EDGE_BRANCH} git@github.com:bricks-software/unleash-on-the-edge.git ${EDGE_FOLDER}
else
    CURRENT=`pwd`
    cd ${EDGE_FOLDER}
    git checkout ${EDGE_BRANCH}
    git pull origin ${EDGE_BRANCH}
    cd ${CURRENT}
fi