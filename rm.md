# Resume Bot — Setup Commands

## Step 1: Uninstall broken pdf-parse, install correct package

cd E:\resume-bot

npm uninstall pdf-parse
npm install pdfjs-dist

## Step 2: Make sure all packages are installed

npm install node-telegram-bot-api @google/generative-ai mammoth pdfkit dotenv axios

## Step 3: Your folder structure should be

resume-bot/
├── bot.js
├── ai.js
├── parser.js
├── .env
├── templates/
│   ├── templateA.js
│   ├── templateB.js
│   └── templateC.js
└── package.json

## Step 4: Run

node bot.js

## Your .env file must have exactly this (no spaces around =)

BOT_TOKEN=7412345678:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX