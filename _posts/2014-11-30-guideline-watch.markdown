---
layout: post
title: Comparing the Android Wear and Apple Watch UI Guidelines
author: emmetc
---

![Android Wear and Apple Watch guidelines]({{ site.url }}/uploads/2014/watches.png)

I wrote the [Android Wear design guidelines](https://developer.android.com/design/wear/index.html) before I left Google earlier this year, so I was curious to browse the well-written and thorough [Apple Watch Human Interface Guidelines](https://developer.apple.com/library/prerelease/ios/documentation/UserExperience/Conceptual/WatchHumanInterfaceGuidelines/index.html#//apple_ref/doc/uid/TP40014992-CH3-SW1) that came out last week. It’s interesting to note some language and ideas common to both.

I’m not highlighting these to make some arch point – there are many striking originalities that differentiate the design of AW and, uh, AW – but only to dig into the vocabulary and design thinking that’s already naturally emerging around these devices.

Emphases mine.


---


*Simple interactions:*

> [Android:](https://developer.android.com/design/wear/creative-vision.html) Android Wear focuses on **simple interactions**, only requiring input by the user when absolutely necessary. Most inputs are based around touch swipes or voice, and inputs requiring fine-grained finger movements are avoided. Android Wear is **gestural, simple, and fast**.

> [Apple:](https://developer.apple.com/library/prerelease/ios/documentation/UserExperience/Conceptual/WatchHumanInterfaceGuidelines/index.html#//apple_ref/doc/uid/TP40014992-CH3-SW1) Apps on Apple Watch are designed for **quick, lightweight interactions** that make the most of the display size and its position on the wrist. Information is accessible and dismissible **quickly and easily**, for both privacy and usability.



*Connectedness:*

> [Android:](https://developer.android.com/design/wear/creative-vision.html) Android Wear devices provide just the right information at just the right time, allowing users to be more **connected to both** the virtual world and the real world.

> [Apple:](https://developer.apple.com/library/prerelease/ios/documentation/UserExperience/Conceptual/WatchHumanInterfaceGuidelines/index.html#//apple_ref/doc/uid/TP40014992-CH3-SW1) No other Apple device has ever been so **connected to the wearer**. It’s important to be mindful of this connection as you design apps for Apple Watch.



*Brief interactions:*

> [Android:](https://developer.android.com/design/wear/principles.html) Time a typical use of your Wear app. If using it takes more than **5 seconds**, you should think about making your app more focused. 

> [Apple:](https://developer.apple.com/library/prerelease/ios/documentation/UserExperience/Conceptual/WatchHumanInterfaceGuidelines/index.html#//apple_ref/doc/uid/TP40014992-CH3-SW1) If you measure interactions with your iOS app in minutes, you can expect interactions with your Watch app to be **measured in seconds**.



*Paged navigation structure:*

> [Android:](https://developer.android.com/design/wear/index.html) Cards in the stream are more than simple notifications. They can be **swiped horizontally to reveal additional pages**. [[…]](https://developer.android.com/design/wear/patterns.html) **Keep the number of detail cards as low as possible**.

> [Apple:](https://developer.apple.com/library/prerelease/ios/documentation/userexperience/conceptual/watchhumaninterfaceguidelines/WatchOSAppAnatomy.html) A paginated interface lets the user **navigate between pages of content by swiping horizontally**. […] A dot indicator at the bottom of each page shows the user’s place in the set. **Keep the total number of pages as small as possible** to simplify navigation.



*Contextual relevance:*

> [Android:](https://developer.android.com/design/wear/index.html) The **context stream** is a vertical list of cards, each showing a **useful or timely** piece of information. […] This UI model ensures that users don’t have to launch many different applications to check for updates; they can simply glance at their stream for a brief update on what’s important to them.

> [Apple:](https://developer.apple.com/library/prerelease/ios/documentation/UserExperience/Conceptual/WatchHumanInterfaceGuidelines/Glances.html#//apple_ref/doc/uid/TP40014992-CH21-SW1) On Apple Watch, a Glance is a quick view of a focused set of content from an app. Ideally, it is **timely and contextually relevant**. […] Configure the Glance based on the user’s current context. Stale or irrelevant information makes a glance less useful. Use time and location to reflect what is relevant to the user right now.



*Short copy:*

> [Android:](https://developer.android.com/design/wear/style.html) Omit needless text. Design for glanceability and not for reading. Use words and phrases, not sentences.

> [Apple:](https://developer.apple.com/library/prerelease/ios/documentation/UserExperience/Conceptual/WatchHumanInterfaceGuidelines/Notifications.html#//apple_ref/doc/uid/TP40014992-CH20-SW1) Keep title strings short and focused. The space available for displaying title strings is minimal, so keep them brief and to the point.



*Notify sparingly:*

> [Android:](https://developer.android.com/design/wear/style.html) **Keep notifications to a minimum**. Don’t abuse the user’s attention. Active notifications (that is, those that cause the device to vibrate) should only be used in cases that are both timely and involve a contact, for example receiving a message from a friend. Non-urgent notifications should be silently added to the Context Stream.

> [Apple:](https://developer.apple.com/library/prerelease/ios/documentation/UserExperience/Conceptual/WatchHumanInterfaceGuidelines/Notifications.html#//apple_ref/doc/uid/TP40014992-CH20-SW1) **Be sensitive to the frequency with which you send notifications** to users. Users might perceive a frequent notifications as annoying and disable notifications for your app on Apple Watch. Always make sure notifications are relevant to what the user wants.



*Discreet notifications:*

> [Android:](https://developer.android.com/design/wear/style.html) **Be discreet if necessary**. Wearables are personal devices by nature, but they are not completely private. If your notification serves **content that may be particularly sensitive** or embarrassing (such as notifications from a dating app or a medical status report), consider not displaying all of the information in a peek card. A notification could place the sensitive information on a second page that must be swiped to, or an application could show different amounts of detail in peek and focused card positions.

> [Apple:](https://developer.apple.com/library/prerelease/ios/documentation/UserExperience/Conceptual/WatchHumanInterfaceGuidelines/Notifications.html#//apple_ref/doc/uid/TP40014992-CH20-SW1) A Short Look appears when a local or remote notification needs to be presented to the user. A Short Look provides a **discreet, minimal amount of information—preserving a degree of privacy**. If the wearer lowers his or her wrist, the Short Look disappears.



*Notification actions:*

> [Android:](https://developer.android.com/design/wear/patterns.html) Actions should be **limited to three for a single card row**.
[[...]](https://developer.android.com/design/wear/structure.html)
Bridged notifications, such as new message **notifications, are pushed to the wearable from the connected handheld** using standard Android notifications.

> [Apple:](https://developer.apple.com/library/prerelease/ios/documentation/UserExperience/Conceptual/WatchHumanInterfaceGuidelines/Notifications.html#//apple_ref/doc/uid/TP40014992-CH20-SW1) Long look notifications can display **up to four custom action buttons**. Apple Watch leverages the interactive **notifications registered by your iOS app** to display action buttons in the Long Look interface.



*Engaging animations:*

> [Android:](https://developer.android.com/design/wear/style.html) A confirmation animation is an opportunity to express your app’s character and insert a **moment of delight for your user**. Keep animations short (less than 1000ms) and simple. Animating the confirmation icon is an effective way of transitioning the user to a new state after completing an action.

> [Apple:](https://developer.apple.com/library/prerelease/ios/documentation/UserExperience/Conceptual/WatchHumanInterfaceGuidelines/Animation.html#//apple_ref/doc/uid/TP40014992-CH7-SW1) Beautiful, subtle animation pervades Apple Watch and makes the experience more **engaging and dynamic for the user**. Appropriate animation can: Communicate status and provide feedback. Help people visualize the results of their actions.
