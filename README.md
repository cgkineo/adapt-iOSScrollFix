adapt-iOSScrollFix
==========================

Allows Adapt to scroll inside iFrames  
Fixes fixed position issues with the navigation bar  
Fixes input tag focus + fixed position elements on ios8  
Fixes fixed position "isFullWidth" trickle button by making it absolutely position rather than fixed  

Result:  

No fixed position elements inside the #wrapper tag  
Smooth ios 8 experience
If needed - scrolling inside iframes (no responsive container iframes in this extension though, sorry)  

NOTES:

https://github.com/adaptlearning/adapt-contrib-trickle/compare/feature/moodle-iframe?expand=1

you'll need to patch trickle. add the class ```.body``` to the resize selectors for the ```body``` element.
