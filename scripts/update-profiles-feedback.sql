-- Add feedback configuration to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS feedback_type VARCHAR(50) DEFAULT 'simple';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS feedback_config JSONB DEFAULT '{}';

-- Update existing profiles with different feedback types
UPDATE profiles SET 
  feedback_type = 'simple',
  feedback_config = '{
    "prompt_template": "You are an expert interview coach. Analyze this interview and provide constructive feedback.",
    "focus_areas": ["communication", "technical_knowledge", "cultural_fit"]
  }'
WHERE name = 'Individual';

UPDATE profiles SET 
  feedback_type = 'multi_analysis',
  feedback_config = '{
    "analyses": [
      {
        "name": "technical_assessment",
        "prompt": "Focus only on technical skills and knowledge demonstrated in this software developer interview.",
        "weight": 0.4
      },
      {
        "name": "communication_assessment", 
        "prompt": "Evaluate communication skills, clarity of explanations, and ability to articulate complex concepts.",
        "weight": 0.3
      },
      {
        "name": "problem_solving_assessment",
        "prompt": "Assess problem-solving approach, logical thinking, and ability to handle challenges.",
        "weight": 0.3
      }
    ],
    "synthesis_prompt": "Combine the following assessments into comprehensive feedback for a software developer interview."
  }'
WHERE name LIKE '%Software Developer%';

UPDATE profiles SET 
  feedback_type = 'detailed',
  feedback_config = '{
    "stages": [
      {
        "name": "initial_analysis",
        "prompt": "Analyze the marketing strategy knowledge and campaign experience shown in this interview."
      },
      {
        "name": "creativity_assessment",
        "prompt": "Evaluate creative thinking and innovative marketing ideas presented."
      },
      {
        "name": "analytical_skills",
        "prompt": "Assess data analysis skills and ROI understanding demonstrated."
      },
      {
        "name": "final_synthesis",
        "prompt": "Create comprehensive feedback combining all assessments for a marketing manager position."
      }
    ]
  }'
WHERE name LIKE '%Marketing Manager%';

UPDATE profiles SET 
  feedback_type = 'simple',
  feedback_config = '{
    "prompt_template": "You are evaluating a project manager interview. Focus on leadership, organization, and team management skills.",
    "format": "structured",
    "sections": ["Leadership", "Organization", "Communication", "Risk Management"]
  }'
WHERE name LIKE '%Project Manager%'; 