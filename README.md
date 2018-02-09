
# LinkedDataDev
Development Projects for Linked Data Workshop and other fun.

# Graph Editor
## Requirements and Dependencies
* Python installed and available at command line to provide http server (or any other http localhost server...)
* D3js Version 3 , supplied in /LinkedDataDev/d3 
* Chrome as web browser

## Installation
Steps assume Windows OS (I know...please forgive me this sin).
1. Clone or download + extract repository to path:  **C:\_gitHub\LinkedDataDev**
Other paths will require modfication of the code to find the .js, .css etc.
2. Start Python http server on localhost. A DOS .bat file is provided in /LinkedDataDev/util, or issue commands:
```
cd C:\_gitHub\LinkedDataDev
python -m http.server
```

3. Open web browser to URL: http://localhost:8000/GraphEditor/GraphEditor.html


## JavaScript Packages
Location: .../GraphEditor/js

1. FileSaver.min.js  
* Save file from browser to local drive. 
* Test file: Test-FileSaverJS-FileCreation.html  , output to file

2. n3-browswer.min.js
* Create TTL 
* Test file: Test-N3-TTLCreation.html, output to console.log

## Acknowledgements

This project is constructed on a foundation provided by code authors from many diverse projects. Thanks to all of you for freely sharing your inspirational code and ideas.
* Ross Kirsling. Directed Graph Editor  http://bl.ocks.org/rkirsling/5001347
* Eli Grey for FileSave JS https://github.com/eligrey/FileSaver.js/
* The countless heros on StackOverflow who donate their time and expertise. 

Code that we created is covered by the GNU General Public License v3.0 (see LICENSE.TXT).
Please make your work available as improvements to this little project.
