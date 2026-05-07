#!/bin/bash

node -e "require('bcrypt').hash('password123', 10).then(console.log)"