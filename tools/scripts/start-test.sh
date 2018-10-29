#!/usr/bin/env bash

if ! git diff --quiet "$TRAVIS_COMMIT_RANGE" -- ;
then
  TRAVIS_COMMIT_RANGE=master...;
fi
CHANGES=$(git --no-pager diff --name-only "$TRAVIS_COMMIT_RANGE");

guide_changed=$(grep -q '^guide' <<< "$CHANGES");
client_changed=$(grep -q '^client' <<< "$CHANGES");
server_changed=$(grep -q '^server' <<< "$CHANGES");
curriculum_changed=$(grep -q '^curriculum' <<< "$CHANGES");
tools_changed=$(grep -q '^tools' <<< "$CHANGES");

npm run lint;

if $guide_changed
then
  npm run test:guide-directories;
fi

if $client_changed || $server_changed || $curriculum_changed || $tools_changed
then
  npm run prebootstrap;
  "$(npm bin)"/lerna bootstrap --ci;
fi

if $tools_changed
then
  npm run test:tools;
fi

if $client_changed
then
  npm run test:client;
fi

if $server_changed
then
  npm run test:server;
fi

if $curriculum_changed
then
  npm run test:curriculum;
fi
