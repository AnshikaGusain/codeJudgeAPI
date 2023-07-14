#!/bin/bash

code=$1
language=$2
input=$3
input=$(echo "$input" | sed 's/ /\n/g')


if [[ "$language" == "python" ]]; then
  echo "$code" > code.py
  result=$(python3 code.py <<< "$input" 2>&1)
  if [[ $? -eq 0 ]]; then
    echo "{\"output\":\"$result\"}"
  else
    echo "{\"output\":\"Execution Error\",\"error\":\"$result\"}"
  fi
elif [[ "$language" == "javascript" ]]; then

  echo "$code" > code.js
  result=$(node code.js <<< "$input" 2>&1)
  if [[ $? -eq 0 ]]; then
    echo "{\"output\":\"$result\"}"
  else
    echo "{\"output\":\"Execution Error\",\"error\":\"$result\"}"
  fi
elif [[ "$language" == "java" ]]; then
  echo "$code" > Main.java
  javac Main.java 2> compilation_error.txt
  if [[ $? -eq 0 ]]; then
    result=$(timeout 5s java Main <<< "$input" 2>&1)
    echo "{\"output\":\"$result\"}"
  else
    compilation_error=$(<compilation_error.txt)
    echo "{\"output\":\"Compilation Error\",\"error\":\"$compilation_error\"}"
  fi
elif [[ "$language" == "c" ]]; then
  echo "$code" > code.c
  gcc -o code code.c 2> compilation_error.txt
  if [[ $? -eq 0 ]]; then
    result=$(timeout 5s ./code <<< "$input" 2>&1)
    echo "{\"output\":\"$result\"}"
  else
    compilation_error=$(<compilation_error.txt)
    echo "{\"output\":\"Compilation Error\",\"error\":\"$compilation_error\"}"
  fi
elif [[ "$language" == "cpp" ]]; then
  echo "$code" > code.cpp
  g++ -o code code.cpp 2> compilation_error.txt
  if [[ $? -eq 0 ]]; then
    result=$(timeout 5s ./code <<< "$input" 2>&1)
    echo "{\"output\":\"$result\"}"
  else
    compilation_error=$(<compilation_error.txt)
    echo "{\"output\":\"Compilation Error\",\"error\":\"$compilation_error\"}"
  fi
else
  echo "{\"error\":\"Unsupported language: $language\"}"
fi
