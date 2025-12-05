# Supabase Configuration Setup

## Environment Variables Required

Copy the following to your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key

# Stripe Configuration (for payments)
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

## How to Get Your Supabase Credentials

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy the **Project URL** and paste it as `NEXT_PUBLIC_SUPABASE_URL`
5. Copy the **anon/public** key and paste it as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Copy the **service_role** key and paste it as `SUPABASE_SERVICE_ROLE_KEY`

## How to Get Your OpenAI API Key

1. Go to [https://platform.openai.com](https://platform.openai.com)
2. Sign in or create an account
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Copy the key and paste it as `OPENAI_API_KEY`
6. **Important**: Store this key securely - you won't be able to see it again!

## Database Setup

### 1. Apply Migrations

Run the following commands to set up your database schema:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Apply all migrations
supabase db push
```

Or apply migrations individually in order:

```bash
supabase migration up --include-all
```

### 2. Migration Files

The project includes the following migrations:

- **`002_job_positions.sql`** - Job position tracking and application management
- **`002_subscriptions.sql`** - Stripe subscription management
- **`003_add_submitted_cv_id.sql`** - Links CVs to job applications
- **`004_fix_duplicates_and_deletion.sql`** - Data integrity improvements
- **`005_career_guidance.sql`** - AI career guidance features
- **`006_add_job_match_details.sql`** - Enhanced job matching capabilities
- **`007_add_cv_metadata.sql`** - CV metadata extraction and storage
- **`008_add_cv_blueprints.sql`** - Learning CV blueprint system

### 3. Database Tables

#### Core Tables
- **`cv_blueprints`** - Accumulated user profiles that learn over time
- **`cv_blueprint_changes`** - Audit trail of blueprint modifications
- **`cv_metadata`** - Individual CV extraction results
- **`job_match_analyses`** - Cached job compatibility results
- **`job_positions`** - User's saved job opportunities
- **`subscriptions`** - Stripe subscription management

#### Helper Functions
- **`get_or_create_cv_blueprint(user_id)`** - Creates user blueprint if needed
- **`record_blueprint_change(...)`** - Logs blueprint changes
- **`calculate_data_completeness(profile_data)`** - Computes profile completeness

## Row Level Security (RLS)

All tables have Row Level Security enabled. Users can only access their own data:

- **cv_blueprints**: Users see only their blueprint
- **cv_metadata**: Users see only their CV metadata
- **job_positions**: Users see only their job applications
- **cv_blueprint_changes**: Users see only their change history

## Authentication Setup

1. Go to **Authentication** → **Settings** in your Supabase dashboard
2. Configure your authentication providers (Email, Google, etc.)
3. Update your authentication settings as needed

## Testing Database Connection

After setup, test your connection:

```bash
# Test database connection
npm run test:db

# Run all tests
npm test
```

## Next Steps

After setting up your environment variables and database:

1. **Restart your development server**
   ```bash
   npm run dev
   ```

2. **Test the setup**
   - Visit `http://localhost:3000`
   - Try uploading a CV
   - Check the browser console for any errors

3. **Available APIs**
   - `POST /api/analyze-cv` - CV analysis
   - `POST /api/extract-cv-metadata` - Metadata extraction
   - `GET /api/cv-blueprint` - User's learning profile
   - `POST /api/evaluate-job-match` - Job compatibility analysis
   - `GET /api/cv-metadata` - CV metadata management

4. **User Features**
   - CV upload and analysis (free)
   - Job matching and application tracking (free)
   - CV metadata management (pro)
   - Learning blueprint system (pro)
   - Career guidance (pro)

## Troubleshooting

### Common Issues

**Migration Errors:**
```bash
# Reset and reapply migrations
supabase db reset
supabase db push
```

**RLS Policy Errors:**
```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

**Authentication Issues:**
- Verify your Supabase keys are correct
- Check that RLS policies are active
- Ensure authentication is properly configured

**OpenAI API Issues:**
- Verify your API key is valid and has credits
- Check rate limits and usage
- Ensure GPT-4o model access

### Support

For additional help:
- Check the [Supabase Documentation](https://supabase.com/docs)
- Review the [OpenAI API Documentation](https://platform.openai.com/docs)
- Check the project issues on GitHub
