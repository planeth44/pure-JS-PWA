
This an attempt in the same spirit as [Morris Vanilla To Do](https://github.com/morris/vanilla-todo) to demonstrate how you can develop a PWA with only HTML, CSS and pure Javascript.
I have aggregated all the knowledge and edge cases I’ve experienced through many PWA development and in production

<!-- TOC start -->
- [The constraints](#the-constraints)
- [Technical choices](#technical-choices)
- [What the app does](#what-the-app-does)
  * [Things](#things)
  * [Files ](#files)
- [HTML forms](#html-forms)
- [Auto save](#auto-save)
    + [alternate method](#alternate-method)
- [Form validation](#form-error-validation)
- [Syncing and offline](#syncing-and-offline)
  * [Update](#update)
    + [possible scenario](#possible-scenario)
- [Back-end](#back-end)
- [Dependencies](#dependencies)
<!-- TOC end -->

## The constraints

- performance first, it’s a non negociable.
- the app should feel snappy. No lagging between pages
- It should be light weight (140KB unminified) 
- It is a PWA. Because that’s what I want to demonstrate

## Technical choices

- make use of the native API : service worker, module, ... 
- Be as close as possible to web API
- Go for the least amount of code and the least amout of abstraction
- Multi page rather than single page
  - no router, use service worker precache and route
  - browsers are super fast at parsing HTML
  - no state management
  - one controller per page [locality of behavior as per  </> htmx
](https://htmx.org/essays/locality-of-behaviour/)
  - DB operations in controller

## What the app does
One use that PWAs are good for is line of business mobile app. Think field worker needing to fill a report.
The conditions of use are often offline.  
You could imagine the "form factor" as a tiny back-office for one.  
This meas that the app does mainly CRUD operations plus a significative one : Syncing to a central serer.

### Things

This PWA create a “Thing” (think: a report, some data entries). You can attach files to this “Thing”. 
  - Things are created via an HTML form
  - all the “Thing” are stored in indexedDB
  - likewise all the files are stored in indexedDB

### Files 
- Files are a separate issue
  - files are stored as arrayBuffer (iOS does not support blob in iDB)
  - are dependent on the parent Thing
  - all the file methods are in their own controller 

## HTML forms

- HTML form controls are great for data entry
  - you get build-in behavior, UI and accessibility
  - you get build-in event
  - you get build-in validation

- a “Thing” instance is represented by a model
- form controls are mapped to model properties
  - for this example I chosed to have some nested property 
  - I wrote a little helper function to get or set a property from control`[name]` as property path
  - this make it possible to have a deeply nested object Thing

## Data binding
- Auto save is expected in a mobile app,it’s a given  
This means that you need some sort of data-binding one way or two way depending on your design.  

For some previos PWA in production I experimented with as standalone library : data-tier.  
It was "kind of" great in that the concept and the docs resonated with what I had in mind.  
But in use it turned out to be too much for the kind of app I make. The library weight [] and it's quite slow on the initializion phase.  
I think that the problem is it caters to too many use case thtat don’t apply to what I do.

Thinking about that, I realized that form control give you a lot of built-in events. That would be a good start to implement a rustic data-binding.  
I went for the `change` event. It is fired after the value has changed https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event
  - all the values in the form controls are available in formData. But the FormData object is not storable as is in indexedDB, you need to transform it to a storable object.  
  - after a `change` event you want to update the model property from the form control.
  - You can do it with some additional control  
  it’s possible to overide the default updating with `data-change` attribute on the form control element
    - this let you do some computation on the new value
    - or even set other object property (example in changeHandler)

As the Thing could need an update, I wanted to have a way to update the form controls from a Thing object when the page is loaded.  
This is done by looping through all the controls.  
I wrote a formControlUpdater with one method per form control type.  
This provide the other side of a two way data-binding. Very rustic but only what I need and not more.

#### alternate method
  - alternatively with a simpler mapping, [there is an example from Jake Archibald](https://jakearchibald.com/2021/encoding-data-for-post-requests/#bonus-round-converting-formdata-to-json)

## Form validation
  - The built-in UI for validation is not always desirable.
    - the form can get long and on a mobile it’s not easy to scroll back to a missing field
    - another case is adding othe form controls along the way
  - To make a custom validation UI, add the attribute `novalidate` to your form
  - Validation is called when the `submit` event is fired
  - A list of errors is shown at the top of the page and validation messages are added below the fields
  - When all data is validated, we call a sync to the server

## Syncing and offline

You don’t find a lot of well documented examples of uses cases for real life/ in production apps.
The code in this repo is the result of all the experiments I ran, and has been battle tested in prod.

  - you get a Web API `background-sync` but you need a fallback:
    -> iOS/ Firefox does not support it
  - `background-sync` will not support all the cases
    in fact it does only one thing: retry if the app is offline(airplane mode). 
    - does not always identify an offline situation
    - does not support cases for failed sync as errors returned from the server and retry
  - either the app or the user must have a way to know what is the state of the sync
  - as of now, the user is responsible for checking the sync state of the Things
  - but we should not rely either on background-sync or user or the service worker starting
  - I’m testing a mitigation mechanism by storing and checking the sync state for the data.
  
  - files are sent with PUT method in binary form. A `fetch` `body` can be of many flavor. https://developer.mozilla.org/en-US/docs/Web/API/fetch#body including `ArrayBuffer`
    - this is to get around an iOS quirk again. Safari does not support formData.append file in service worker
    - with this solution we dont rely on a polyfill
  
### Update

  This part is dependent on the server, because the server is the source of confidence as the server cannot call the client but the inverse is true.

#### possible scenario
  - the client should ask a sync from the server whenever it needs to check for update on Things
  - the server should respond with a version number + lastUpdatedTimestamp
  - if a conflict arise (version number does not match) in case of syncing from client because there was no prior sync or the app was offline when editing a "Thing", the server should reject the sync and reply with its own version of the Thing
  - Client should then store the versioned Thing
    - then how should we choreograph the dance to resolve the conflict ?
    - alert the user
    - show the 2 version (how ? side by side ? Field by field ?)
    - make a UI to merge the 2 versions, field by field ?
  - Simpler solution:
    - works if sync happens in front of the user 
    - client tell that a conflict exists & replace the Thing w/ the server version. But we lose the update from client.

## Back-end
The repo has a very rustic back-end server to just respond to api calls(sync)

## Dependencies
  - Workbox. Service worker API is very low level  
  It just makes sense to use this library.  
  Precache an route are essential to MPA, it saves you from a round trip to the server.  
  Only include needed components.  
  Not using their backgroundSync component (the use case is too limited).  
  - iDB from Jake Archibald  
  very small and worth ten time the footprint  
  indexedDB is old and asynchronous. This library promisify it and make it easier to work with
  - picnic.css
  - that's all