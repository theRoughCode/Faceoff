# Faceoff
[Faceoff](http://www.facemeoff.com) is a multiplayer web platform where you rack up points by resisting the urge to laugh at funny videos you watch with other players. This platform utilizes Microsoft's Azure emotion API to detect even the slightest smile. Although the goal of the game is to not laugh, this web app is meant to bring individuals together while collecting data on human reaction to pieces of video sequences.

### Backend System Setup
The server application is made with Node.js & Express.js. The system is a Ubuntu 16.04 virtual machine.

### Networking Information
The domain was registered from Domain.com using MLH promotion code for MHacks X 2017 event. Amazon Web Services' Route 53 handles the Domain Name Server (DNS) routing. A TLS certificate was obtained for secure functionality.

### Client Information
The front-end of the application is made with jQuery, Foundation, Vue.js.
Animations were made using Adobe Illustrator and After Effects and integrated into the project using bodymovin.js.

### Description
The application will make POST requests to Microsoft's Cognitive Services, specifically sending images to the Emotions API. It expects a JSON response.
