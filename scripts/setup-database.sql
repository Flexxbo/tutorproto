-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  remaining_seconds INTEGER DEFAULT 1500, -- 25 minutes default
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  job_title VARCHAR(255) NOT NULL,
  job_description TEXT NOT NULL,
  elevenlabs_agent_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create interviews table
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_name VARCHAR(255) NOT NULL,
  job_description TEXT NOT NULL,
  cv_info TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'idle',
  duration_seconds INTEGER DEFAULT 0,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create transcript_entries table
CREATE TABLE transcript_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  speaker VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  timestamp VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_interviews_user_id ON interviews(user_id);
CREATE INDEX idx_interviews_status ON interviews(status);
CREATE INDEX idx_transcript_entries_interview_id ON transcript_entries(interview_id);

-- Insert sample users (passwords are hashed 'password123')
INSERT INTO users (username, password_hash, remaining_seconds) VALUES
('testuser1', '$2b$10$ELfWB3Ssz5uUPGP/IKwkiuclL5Naa5/KtqoAhRGYJPGHlQi8AmdBS', 1500),
('testuser2', '$2b$10$ELfWB3Ssz5uUPGP/IKwkiuclL5Naa5/KtqoAhRGYJPGHlQi8AmdBS', 3600),
('demo', '$2b$10$ELfWB3Ssz5uUPGP/IKwkiuclL5Naa5/KtqoAhRGYJPGHlQi8AmdBS', 7200);

-- Insert sample profiles
INSERT INTO profiles (name, job_title, job_description, elevenlabs_agent_id) VALUES
('Individual', 'Custom Position', 'Use your own job description and CV information for a personalized interview experience.', 'ELEVEN_AGENT_ID_INTERVIEW'),
('Profile 1 - Software Developer', 'Senior Software Developer', 'We are looking for a Senior Software Developer to join our dynamic team. You will be responsible for developing high-quality software solutions, collaborating with cross-functional teams, and mentoring junior developers. The ideal candidate has 5+ years of experience in full-stack development, proficiency in modern frameworks like React/Node.js, and strong problem-solving skills. You should be comfortable with agile methodologies, code reviews, and continuous integration practices.', 'ELEVEN_AGENT_ID_PROFIL1'),
('Profile 2 - Marketing Manager', 'Digital Marketing Manager', 'Join our marketing team as a Digital Marketing Manager where you will lead our online marketing initiatives. You will develop and execute comprehensive digital marketing strategies, manage social media campaigns, analyze market trends, and optimize our online presence. We are seeking someone with 3+ years of digital marketing experience, proficiency in marketing automation tools, Google Analytics, and social media platforms. Strong analytical skills and creativity are essential for this role.', 'ELEVEN_AGENT_ID_PROFIL2'),
('Profile 3 - Project Manager', 'Senior Project Manager', 'We are seeking an experienced Senior Project Manager to oversee complex projects from initiation to completion. You will coordinate cross-functional teams, manage project timelines and budgets, identify risks, and ensure successful project delivery. The ideal candidate has PMP certification or equivalent, 5+ years of project management experience, excellent communication skills, and proficiency in project management tools like Jira, Asana, or MS Project.', 'ELEVEN_AGENT_ID_PROFIL3'); 