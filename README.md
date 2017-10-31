
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
Location in GraphEditor/js

1. FileSaver.min.js  
* Save file from browser to local drive. 
* Test file: Test-FileSaverJS-FileCreation.html  , output to file

2. n3-browswer.min.js
* Create TTL 
* Test file: Test-N3-TTLCreation.html, output to console.log