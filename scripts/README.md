# Setup Instructions

## Database Setup

1. **Create a Supabase project** at https://supabase.com
2. **Run the database setup script**:
   - Copy the contents of `setup-database.sql`
   - Go to your Supabase dashboard → SQL Editor
   - Paste and execute the script

## Environment Configuration

1. **Copy the environment template**:
   ```bash
   cp .env.example .env
   ```

2. **Fill in your credentials**:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - `ELEVENLABS_API_KEY`: Your ElevenLabs API key
   - `ELEVEN_AGENT_ID_*`: Your ElevenLabs agent IDs for different profiles
   - `OPENAI_API_KEY`: Your OpenAI API key

## Sample Users

The setup script creates these test users (password: `password123`):
- `testuser1` - 25 minutes credit (1500 seconds)
- `testuser2` - 60 minutes credit (3600 seconds) 
- `demo` - 120 minutes credit (7200 seconds)

## Sample Profiles

4 profiles are created:
1. **Individual** - Custom job description
2. **Profile 1** - Software Developer position
3. **Profile 2** - Marketing Manager position
4. **Profile 3** - Project Manager position

Each profile is linked to a specific ElevenLabs agent ID from your environment variables.

## Running the Application

```bash
npm run dev
```

The application will be available at http://localhost:3000 