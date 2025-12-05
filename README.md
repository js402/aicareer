# TechCareer.AI - AI-Powered CV Analysis Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.0-green)](https://supabase.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-red)](https://openai.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635bff)](https://stripe.com/)

An intelligent career guidance platform that analyzes CVs, matches job opportunities, and learns from user interactions to provide increasingly accurate career insights.

## 🌟 Key Features

### 🤖 AI-Powered CV Analysis
- **Comprehensive Analysis**: GPT-4 powered evaluation of skills, experience, and career trajectory
- **Structured Insights**: Detailed breakdown of strengths, areas for improvement, and recommendations
- **Industry Matching**: Tailored advice for specific roles and companies

### 🧠 Learning CV Blueprints
- **Progressive Learning**: System accumulates knowledge from multiple CV uploads
- **Intelligent Merging**: Smart deduplication and confidence scoring
- **Evolution Tracking**: Monitors profile improvements over time

### 🎯 Job Match Intelligence
- **Blueprint-Powered**: Uses accumulated profile data for job matching
- **Real-time Analysis**: Instant compatibility scoring with detailed explanations
- **Skills Gap Analysis**: Identifies missing competencies and provides learning paths

### 📊 Career Management Dashboard
- **Unified Profile**: Single source of truth for career data
- **Progress Tracking**: Visual indicators of profile completeness and confidence
- **Metadata Management**: Edit and organize extracted CV information

### 💳 Subscription Management
- **Flexible Pricing**: Free tier with premium features
- **Stripe Integration**: Secure payment processing
- **Feature Gates**: Pro features for advanced users

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/techcareer-ai.git
   cd techcareer-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```

   Configure the following variables:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # OpenAI
   OPENAI_API_KEY=your_openai_api_key

   # Stripe
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_webhook_secret
   ```

4. **Database Setup**
   ```bash
   # Apply migrations
   npx supabase db push

   # Or run individual migrations
   npx supabase migration up
   ```

5. **Development Server**
   ```bash
   npm run dev
   ```

6. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## 📋 API Documentation

### CV Analysis Endpoints

#### `POST /api/analyze-cv`
Analyzes a complete CV and provides comprehensive career insights.

**Request Body:**
```json
{
  "cvContent": "Full CV text content..."
}
```

**Response:**
```json
{
  "analysis": "Detailed markdown analysis...",
  "extractedInfo": {
    "name": "John Doe",
    "contactInfo": {...},
    "experience": [...],
    "skills": [...],
    "education": [...]
  }
}
```

#### `POST /api/extract-cv-metadata`
Extracts structured metadata from CV content without full analysis.

#### `GET /api/cv-blueprint`
Retrieves user's accumulated CV blueprint profile.

#### `POST /api/cv-blueprint`
Processes new CV data into the learning blueprint.

#### `POST /api/evaluate-job-match`
Analyzes job compatibility using blueprint data.

**Request Body:**
```json
{
  "jobDescription": "Full job posting text..."
}
```

**Response:**
```json
{
  "matchScore": 85,
  "matchingSkills": ["React", "Node.js"],
  "missingSkills": ["Vue.js"],
  "experienceAlignment": {
    "seniorityMatch": "Good Fit",
    "yearsExperienceRequired": 3,
    "yearsExperienceCandidate": 4
  },
  "recommendations": ["Consider learning Vue.js for this role"]
}
```

### Career Management Endpoints

#### `GET /api/cv-metadata`
Retrieves all CV metadata for the authenticated user.

#### `PUT /api/cv-metadata/[id]`
Updates specific CV metadata entry.

#### `DELETE /api/cv-metadata/[id]`
Removes CV metadata entry.

### Job Position Management

#### `GET /api/job-positions`
Lists user's saved job positions.

#### `POST /api/job-positions`
Creates new job position entry.

#### `PATCH /api/job-positions/[id]`
Updates job position status and notes.

## 🗄️ Database Schema

### Core Tables

#### `cv_blueprints`
Accumulated user profile data that learns over time.

#### `cv_blueprint_changes`
Audit trail of blueprint modifications and learning events.

#### `cv_metadata`
Individual CV extraction results with user management.

#### `job_match_analyses`
Cached job compatibility analysis results.

#### `job_positions`
User's saved job opportunities with application tracking.

#### `subscriptions`
Stripe subscription management.

## 🔧 Configuration

### Supabase Setup
See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed database configuration.

### Stripe Integration
See [STRIPE_SETUP.md](./STRIPE_SETUP.md) for payment processing setup.

### OpenAI Configuration
- Uses GPT-4o for analysis
- Configurable model via `DEFAULT_MODEL` in `lib/openai.ts`
- Rate limiting and error handling included

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- tests/api/
npm test -- tests/lib/

# Run with coverage
npm run test:coverage
```

### Test Structure
- **API Tests**: Endpoint functionality and error handling
- **Library Tests**: Business logic and utility functions
- **Integration Tests**: End-to-end workflows

## 🚢 Deployment

### Vercel (Recommended)
1. Connect GitHub repository
2. Configure environment variables
3. Deploy automatically on push

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Manual Deployment
```bash
npm run build
npm start
```

## 🔐 Security Features

- **Row Level Security**: All database queries scoped to authenticated users
- **API Rate Limiting**: Prevents abuse and ensures fair usage
- **Input Validation**: Comprehensive validation on all endpoints
- **Authentication**: Supabase Auth with JWT tokens
- **HTTPS Only**: Secure communication in production

## 📈 Performance Optimizations

- **Caching**: Job match results cached to reduce API calls
- **Blueprint Learning**: Reduces redundant analysis over time
- **Lazy Loading**: Components load on demand
- **Database Indexing**: Optimized queries for large datasets

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Development Guidelines
- **TypeScript**: Strict typing required
- **Testing**: 80%+ test coverage
- **Linting**: ESLint configuration enforced
- **Commits**: Conventional commit format

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for GPT-4o model
- **Supabase** for backend infrastructure
- **Stripe** for payment processing
- **Next.js** for the React framework
- **Tailwind CSS** for styling

## 📞 Support

For support, email support@techcareer.ai or join our Discord community.

---

**Built with ❤️ for developers by developers**
