#!/bin/sh
# Fake ping responder for the diagnostic tool. No real network traffic.
echo "PING $1 (127.0.0.1): 56 data bytes"
echo "64 bytes from 127.0.0.1: icmp_seq=0 ttl=64 time=0.041 ms"
echo "64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=0.038 ms"
echo "--- 127.0.0.1 ping statistics ---"
echo "2 packets transmitted, 2 received, 0% packet loss"
