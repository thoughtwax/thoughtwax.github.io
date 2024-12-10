---
author: emmetc
comments: true
date: 2007-08-19 14:26:05
layout: post
slug: reading-live-data-from-a-garmin-gps-unit-on-os-x
title: Reading live data from a Garmin GPS unit on OS X
wordpress_id: 320
categories:
- programming
---

_If you're not interested in how to connect a GPS unit to a Mac you can stop reading now. In fact, as your doctor I advise you to do so immediately, this is desperately dull stuff._

I don't normally do this type of thing, but I needed to document this anyway, and I feel morally compelled to make this information available to potential Google searchers. Perhaps it will protect future generations of frustrated GPS hackers from the frustrating death by a thousand cuts I almost suffered in trying to figure this out by myself. It shouldn't be this hard, but it is, and there's almost no information out there on how to overcome the many small pitfalls you will encounter if you're trying to read live GPS data on your computer.

A note before we start: I know very little about this topic, really, so beyond what I lay out here I won't be able to help you out with any other problems you might encounter. This is one specific way of doing things, and I don't know any other (although I don't doubt that many alternatives exist, many of them perhaps better and simpler), and I learned this by figuring out everything as I went. This will be the very basic outline of the process that I wished I could have found beforehand.

Let's begin.

The purpose of the exercise is to get a constantly-updating live reading of your current global longitude and latitude coordinates on a computer. To do this you'll need a GPS unit. I chose one of the most common and cheapest models available, the yellow [Garmin eTrex](https://buy.garmin.com/shop/shop.do?pID=6403), which I bought new on eBay for about â‚¬100. You'll also have to buy a serial cable connection to attach to your GPS unit (it doesn't come with the unit as you might expect), and a serial-to-USB cable to connect _that_ to your computer (this assumes that your computer doesn't have a serial connector). I got [the official Garmin GPS to serial cable](https://buy.garmin.com/shop/shop.do?pID=654) which worked as expected. _Caveat emptor_ when buying the serial-to-USB adapter though; I got a cheap one from Maplin, and the driver software came on one of those mini-CDs that won't work in a slot loading CD drive like the one on a Macbook Pro. Instead I got a [Keyspan serial adapter](http://www.keyspan.com/products/usb/USA19HS/), which worked fine and seemed fairly Mac-friendly. Install the adapter driver, plug everything together, and you're all set up.

If you just want to view your current location, the OS X freeware program [GPS Connect](http://www.chimoosoft.com/products/gpsconnect/) should be sufficient. Once your GPS unit is plugged in and switched on, you can select your serial port ("KeySerial1" if you're using a KeySpan adapter) and Protocol ("NMEA"), click Connect, and your live GPS data will appear in the app's dialog box and update as it changes.

![GPS Connect screenshot]({{ site.url }}/uploads/2007/08/gps-screenshot.png)

Simple so far. However, if you want to programmatically use the data (and you probably do, since you could already read this data from the GPS unit's own screen), you'll have to access it another way. I wanted to use Python to manipulate the data once I had it, so it made sense to also use Python to actually import the data. (This next bit assumes you know how to program a little in Python and know the basics of using the command line Terminal.app.)

There's a [PyGarmin](http://pygarmin.sourceforge.net/) module for Python, but as far as I can tell it only supports serial connection to Garmin's own proprietary GPX format, an XML-like text format for storing saved waypoints and tracklogs (i.e. GPS values that you have already collected and saved on your handheld unit). To get live, constantly-updating GPS values, you'll need to read data in the standard [NMEA](http://www.gpsinformation.org/dale/nmea.htm) serial protocol. To do this, you'll need to first read the serial data (even though it's actually coming in your USB port, it's still serial data), then convert it from NMEA to numerical lat and long values. Luckily, there are Python modules to help to do this. Install [PySerial](http://pyserial.sourceforge.net/) and [PyGPS](http://pygps.org/#pygps).

Before writing your Python script you need to configure the GPS device to send data in the correct format, and know the name of the port that the data is coming in on. On your GPS unit, go to Setup, then Interface. Change I/O Format to "NMEA" and take note of your Baud number (mine was 4800). Then with your GPS unit plugged in and switched on, open Terminal.app and list all ports available to you by typing



`$ cd /dev`
`$ ls -la`



There should be a couple of new port names in the long list that had not been there before you connected your USB cable. Mine were `cu.KeySerial1` and `tty.KeySerial1` (the name is obviously dictated by the serial-to-USB converter you use), and one of these is the port that your NMEA data is available on. Use the `cat` command to view each port's data, and the correct one should display garbled text. This is your active port (in my case it was `cu.KeySerial1`). Now you're ready to write your Python script that will read this data and output it as GPS coordinates. Here's a basic sample script:



`import NMEA`
`import serial`
``
`ser = serial.Serial('/dev/cu.KeySerial1', 4800, timeout=1)`
``
`while 1:`
` lat,lon=0,0`
` line = ser.readline()`
` nmea = NMEA.NMEA()`
` nmea.handle_line(line[:-1])`
` lat = nmea.lat`
` lon = nmea.lon`
` if lat != 0:`
` print lat,lon`



Note that in the line that defines `ser`, the first parameter must match your active port name and the second must match the baud rate that you set on the GPS unit's Interface screen. Running this file continually prints your current location:



`$ python sample.py`
`53.3312616667 -6.26907666667`
`53.3312616667 -6.26907666667`
`53.3312616667 -6.269075`
`53.3312616667 -6.269075`
`53.3312616667 -6.269075`
`53.3312616667 -6.269075`
`53.3312616667 -6.269075`
`53.3312616667 -6.269075`
`53.33126 -6.269075`
`53.33126 -6.269075`
`53.33126 -6.269075`
