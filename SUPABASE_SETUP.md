# Supabase Configuration Setup

## Environment Variables Required

Copy the following to your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key
```

## How to Get Your Supabase Credentials

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy the **Project URL** and paste it as `NEXT_PUBLIC_SUPABASE_URL`
5. Copy the **anon/public** key and paste it as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## How to Get Your OpenAI API Key

1. Go to [https://platform.openai.com](https://platform.openai.com)
2. Sign in or create an account
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Copy the key and paste it as `OPENAI_API_KEY`
6. **Important**: Store this key securely - you won't be able to see it again!

## Next Steps

After setting up your environment variables:
1. Restart your development server
2. The Supabase client will be available via `import { supabase } from '@/lib/supabase'`
3. The OpenAI client will be available via `import { openai } from '@/lib/openai'`
4. Use the CV analysis API at `/api/analyze-cv`
