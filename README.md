
# [Planning Poker](https://planning-poker-live.herokuapp.com)
A simple web-based planning poker application.

Go to https://planning-poker-live.herokuapp.com if you want to take a look at the application or use it directly.

# Getting started

To get the sourcecode you can either clone it via `git clone https://github.com/jis3r/planning-poker.git` or [download it as a zip](https://github.com/jis3r/planning-poker/archive/refs/heads/master.zip).

## Backend

Start the project locally by navigating inside the project-folder and installing all dependencies with
```bash
npm install
```
Then you can start the backend in the same directory by using
```bash
npm run dev
```
The server now runs on your http://localhost:3000. You can change the port in the `server.js` file.
```javascript
const PORT = process.env.PORT || 3000;
```

## Frontend

Start the frontend by going to the `frontend` directory inside your project folder. Then load all dependencies with
```bash
npm install
```

You can start a development server on http://localhost:5000 with 
```bash
npm run dev
```
Notice that this project-instance won't be connected with the backend. This is no problem as you don't need it seperatly hosted to use the app on port 3000.

To create an optimized version of the project, run 
```bash
npm run build
```
