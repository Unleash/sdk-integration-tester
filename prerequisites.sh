#!/usr/bin/env bash
set -e
EDGE_BRANCH=${EDGE_BRANCH:-main}
EDGE_FOLDER=${EDGE_FOLDER:-unleash-on-the-edge}
CURRENT=`pwd`
if [ ! -d ${EDGE_FOLDER} ]; then
    git clone git@github.com:bricks-software/unleash-on-the-edge.git ${EDGE_FOLDER}
    cd ${EDGE_FOLDER}
    git checkout ${EDGE_BRANCH}
else
    cd ${EDGE_FOLDER}
    git fetch
    git checkout ${EDGE_BRANCH}
    git merge --ff-only origin/${EDGE_BRANCH}
fi
cd ${CURRENT}