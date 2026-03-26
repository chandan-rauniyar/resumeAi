# Resume AI Assistant

A Telegram bot that analyzes resumes against job descriptions and generates improved resume templates using AI.

## 📋 Project Overview

**Resume AI Assistant** is an intelligent Telegram bot that helps users optimize their resumes through two main features:

1. **JD Match Score**: Compare your resume against a job description to get a match score (0-10) plus detailed feedback on missing skills, strengths, and suggestions
2. **Resume Fixer**: Automatically improve and reformat your resume with better content, enhanced formatting, and professional styling

### ✨ Key Features

- **Dual Functionality**: Choose between JD matching or resume improvement
- **Multi-format Input**: Accept resumes and job descriptions as plain text, PDF, DOC, DOCX, or TXT files
- **AI-Powered Analysis**: Uses Google Gemini AI for intelligent analysis and improvements
- **JD Matching**: Get detailed match scores with specific feedback on skills gaps and strengths
- **Resume Enhancement**: Makes targeted improvements while preserving original content structure
- **Professional Templates**: Generates 3 different PDF resume designs
- **Session Management**: Maintains conversation state for multi-step workflows
- **File Support**: Supports PDF, Word documents (.doc/.docx), and plain text files

## 🏗 How It Works

### Architecture

The bot consists of several key components:

```
resume-bot/
├── bot.js          # Main Telegram bot logic and message handling
├── ai.js           # AI processing using Google Gemini
├── parser.js       # Text extraction from PDF/DOC/DOCX/TXT files
├── templates/      # PDF generation templates
│   ├── templateA.js # Classic template
│   ├── templateB.js # Modern blue template
│   └── templateC.js # Creative dark template
├── package.json    # Dependencies and scripts
└── .env           # Environment variables (API keys)
```

### Workflow

1. **Mode Selection**: User chooses from two options:
   - JD Match Score: Compare resume against job description
   - Resume Fixer: Improve and reformat existing resume

2. **Input Reception**:
   - For JD Match: User sends job description, then resume
   - For Resume Fixer: User sends resume (text, PDF, or DOCX)

3. **Processing**:
   - **JD Match**: AI analyzes resume against JD, provides score and feedback
   - **Resume Fixer**: AI improves content, generates 3 PDF templates

### Dependencies

- **node-telegram-bot-api**: Telegram bot framework
- **@google/generative-ai**: Google Gemini AI integration
- **pdfjs-dist**: PDF text extraction
- **mammoth**: Word document text extraction
- **pdfkit**: PDF generation
- **axios**: HTTP requests for file downloads
- **dotenv**: Environment variable management

## 🚀 Setup Instructions

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- Telegram Bot Token (from @BotFather)
- Google Gemini API Key

### Installation

1. **Clone or download the project**
   ```bash
   cd E:\resume-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env file**
   Create a `.env` file in the root directory with:
   ```
   BOT_TOKEN=your_telegram_bot_token_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

### Running the Bot

```bash
npm start
# or
node bot.js
```

The bot will start polling for messages and display "Resume Assistant Bot is running..."

## 📱 Usage

### Starting a Session

Send `/start` to begin. The bot will show a menu with two options:

```
Welcome to Resume AI Assistant.

Choose a feature:
1) JD + Resume -> Match Score (out of 10)
2) Resume Fixer (improved content + formatting)

You can type /reset anytime.
```

### Option 1: JD Match Score

1. **Select mode**: Reply with "1" or type "JD Match Score"
2. **Provide JD**: Send the job description as text or upload PDF/DOC/DOCX/TXT file
3. **Provide resume**: Upload PDF/DOC/DOCX/TXT file or paste resume text
4. **Get results**: Receive match analysis
5. **Optional improvement**: Choose YES/NO for tailored resume generation

**Example Output:**
```
📊 Match Score: 7.5/10

❌ Missing Skills:
1. React.js experience
2. AWS cloud services
3. Agile methodology

✅ Strengths:
1. Strong JavaScript fundamentals
2. Database design experience
3. Problem-solving skills

💡 Smart Suggestions:
1. Add React certification
2. Include AWS project examples
3. Highlight agile team experience
```

### Option 2: Resume Fixer

1. **Select mode**: Reply with "2" or type "Resume Fixer"
2. **Provide resume**: Upload file or paste text
3. **Get improved versions**: Receive 3 professional PDF resume templates

**Example Output:**
```
✅ Resume Fixer complete.

🔧 Improvements Made:
1. Fixed minor grammar issues
2. Strengthened 2-3 action verbs
3. Improved bullet point formatting
4. Added metrics where clearly present in original

💡 Smart Suggestions:
1. Consider adding LinkedIn profile
2. Include portfolio website if available
3. Add professional certifications
```

### File Formats Supported

- **PDF**: `.pdf` files
- **Word Documents**: `.docx` and `.doc` files
- **Plain Text**: `.txt` files

### Commands

- `/start`: Begin new session and show menu
- `/reset`: Reset current session and show menu

## 🔧 Configuration

### Environment Variables

- `BOT_TOKEN`: Your Telegram bot token from @BotFather
- `GEMINI_API_KEY`: Google Gemini API key from Google AI Studio

### File Structure

Ensure your project has this structure:
```
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
```

## 🛠 Development

### Adding New Templates

1. Create new template file in `templates/` directory
2. Implement `generateTemplateX(resume, outputPath)` function
3. Export the function
4. Import and call in `bot.js`

### Modifying AI Prompts

Edit the prompt in `ai.js` to change analysis criteria or output format.

### Error Handling

The bot includes comprehensive error handling for:
- File processing failures
- AI API errors
- PDF generation issues
- Invalid file formats

## 📄 License

ISC License

## 🤝 Contributing

Feel free to submit issues and enhancement requests!