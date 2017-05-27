#!/usr/bin/env bash

set -e

if [ -z ${TRAVIS_TAG} ]; then
    echo "Skip Deploy because this is not a tagged commit"
else
    echo "This is a tagged commit, deploying version ${TRAVIS_TAG} to NPM"
    echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" >> ~/.npmrc
    lerna publish --skip-git --yes --repo-version ${TRAVIS_TAG} --force-publish=*
fi