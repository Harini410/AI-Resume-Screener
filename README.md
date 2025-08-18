# AI Resume Screener

A Next.js 14 web application that uses AI-powered semantic analysis to match resumes against job descriptions, providing detailed insights and scoring.

## Features

### 🤖 AI-Powered Analysis
- **Semantic Similarity**: Uses TensorFlow.js Universal Sentence Encoder for deep text understanding
- **Keyword Matching**: Traditional skill-based matching for comprehensive analysis
- **Combined Scoring**: Weighted algorithm (70% semantic + 30% keyword) for accurate results

### 📊 Comprehensive Analytics
- **Match Scoring**: Overall, semantic, and keyword-based scores
- **Skills Analysis**: Identifies strengths and missing skills
- **Interactive Dashboard**: Charts and visualizations using Recharts
- **Data Export**: Export analysis results as JSON

### 🎯 Key Capabilities
- Client-side PDF text extraction using PDF.js
- Real-time analysis progress tracking
- Responsive design with Tailwind CSS
- Local data persistence
- Score distribution analytics
- Top skills identification across resumes

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **AI/ML**: TensorFlow.js, Universal Sentence Encoder
- **UI**: Tailwind CSS, shadcn/ui components
- **Charts**: Recharts
- **PDF Processing**: PDF.js (client-side)
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd ai-resume-screener
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### 1. Upload & Analyze
1. Navigate to the **Analyze** page
2. Upload a PDF resume (max 10MB)
3. Paste the job description in the textarea
4. Click "AI Analyze Resume" to start processing

### 2. View Results
The analysis provides:
- **Overall Match Score**: Combined AI + keyword score
- **AI Semantic Score**: Deep contextual understanding
- **Keyword Score**: Traditional skill matching
- **Strengths**: Skills found in both resume and job description
- **Missing Skills**: Required skills not found in resume

### 3. Dashboard Analytics
Access the dashboard to view:
- Score distribution across all analyzed resumes
- Quality breakdown (Excellent/Good/Fair/Poor)
- Score comparison charts
- Most common skills analysis
- Individual resume management

## API Endpoints

### POST /api/analyze
Analyzes resume text against job description.

**Request Body:**
\`\`\`json
{
  "resumeText": "string",
  "jobDescription": "string"
}
\`\`\`

**Response:**
\`\`\`json
{
  "matchScore": 85,
  "semanticScore": 82,
  "keywordScore": 90,
  "resumeSkills": ["React", "TypeScript", "Node.js"],
  "jobSkills": ["React", "TypeScript", "Python"],
  "matchingSkills": ["React", "TypeScript"],
  "missingSkills": ["Python"],
  "skillsAnalysis": {
    "totalResumeSkills": 15,
    "totalJobSkills": 12,
    "matchingSkillsCount": 8,
    "missingSkillsCount": 4,
    "skillMatchPercentage": 67
  }
}
\`\`\`

## Architecture

### Client-Side Processing
- **PDF Extraction**: Uses PDF.js to extract text directly in the browser
- **Data Storage**: localStorage for persistence across sessions
- **Real-time Updates**: Progress tracking during analysis

### AI Analysis Pipeline
1. **Text Preprocessing**: Clean and normalize input text
2. **Embedding Generation**: Create vector representations using Universal Sentence Encoder
3. **Similarity Calculation**: Compute cosine similarity between embeddings
4. **Skill Extraction**: Pattern matching against curated skill database
5. **Score Combination**: Weighted average of semantic and keyword scores

### Skill Detection
The app recognizes 100+ technical skills across categories:
- Programming Languages (JavaScript, Python, Java, etc.)
- Frameworks & Libraries (React, Angular, Django, etc.)
- Databases (MySQL, MongoDB, PostgreSQL, etc.)
- Cloud & DevOps (AWS, Docker, Kubernetes, etc.)
- Tools & Methodologies (Git, Agile, CI/CD, etc.)

## File Structure

\`\`\`
├── app/
│   ├── analyze/page.tsx          # Resume upload & analysis page
│   ├── dashboard/page.tsx        # Analytics dashboard
│   ├── api/analyze/route.ts      # Analysis API endpoint
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Homepage
├── components/
│   ├── navigation.tsx            # Navigation component
│   └── ui/                       # shadcn/ui components
├── utils/
│   ├── pdf-parser.ts             # PDF text extraction
│   ├── embeddings.ts             # AI analysis & similarity
│   └── text-analysis.ts         # Skill extraction & matching
└── README.md
\`\`\`

## Performance Considerations

### AI Model Loading
- Model is loaded once and cached for subsequent analyses
- Uses Universal Sentence Encoder Lite for optimal performance
- Fallback to keyword-only analysis if AI model fails

### Client-Side Processing
- PDF processing happens entirely in the browser
- No server-side file uploads required
- Real-time progress feedback

### Data Management
- localStorage for client-side persistence
- Efficient chart rendering with Recharts
- Lazy loading of dashboard components

## Limitations

1. **PDF Support**: Only supports text-based PDFs (not scanned images)
2. **File Size**: 10MB maximum file size limit
3. **Browser Compatibility**: Requires modern browsers with WebGL support
4. **Skill Database**: Limited to predefined skill list (expandable)
5. **Language**: Currently optimized for English text only

## Future Enhancements

- [ ] Support for multiple file formats (DOC, DOCX)
- [ ] OCR for scanned PDF documents
- [ ] Custom skill database management
- [ ] Batch processing for multiple resumes
- [ ] Advanced filtering and search in dashboard
- [ ] Resume ranking and comparison tools
- [ ] Integration with ATS systems
- [ ] Multi-language support

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [TensorFlow.js](https://www.tensorflow.org/js) for AI capabilities
- [PDF.js](https://mozilla.github.io/pdf.js/) for PDF processing
- [shadcn/ui](https://ui.shadcn.com/) for UI components
- [Recharts](https://recharts.org/) for data visualization
