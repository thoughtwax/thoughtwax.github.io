---
author: emmetc
comments: true
date: 2007-04-23 00:04:39
layout: post
slug: a-more-reliable-twitter-badge
title: A more reliable Twitter badge
wordpress_id: 310
categories:
- web
---

If God didn't want us to add widgets to our websites he wouldn't have created sidebars.

I added a Javascript call to the Twitter API to display my latest update on this site a while ago, but it slowed page load down quite a bit, so I  removed it again (at least until Twitter get their scaling problems under control). I could have written some server side code to cache my latest update, but it didn't seem worth the effort.

Then Google released the very cool [AJAX Feed API](http://code.google.com/apis/ajaxfeeds/) this week, and I stayed up for hours playing with it. One of the many ways you can use the API is to hit Google's more reliable servers for the latest cached version of a feed (from the same data source that Google Reader uses). So instead of accessing your feed directly, pipe it through Google and call it easily with Javascript.

To display your latest Twitter status, add these lines between your web page's head tags:


    <script type="text/javascript">  
    var THWX_twitter_id = YOUR_TWITTER_ID_NUMBER;
    </script>  
    <script type="text/javascript" src="http://www.google.com/jsapi?key=YOUR_API_KEY"></script>  
    <script type="text/javascript" src="http://thoughtwax.googlepages.com/twitter.js"></script>


Replace `YOUR_TWITTER_ID_NUMBER` with your Twitter feed ID (the number in the URL of your Twitter RSS feed) and replace `YOUR_API_KEY` with your Google Ajax Feeds API key, which you can get [here](http://code.google.com/apis/ajaxfeeds/signup.html).

Then add this HTML where you want your latest update to appear:


    <div id="THWX_twitter_status"></div>


Lovely. Example [here](http://www.thoughtwax.com/sandbox/twitter.html).
