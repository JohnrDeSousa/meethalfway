/*
  # Initial Schema Setup for Halfway Meet App

  1. New Tables
    - `users`
      - `id` (varchar, primary key, auto-generated UUID)
      - `email` (varchar, unique)
      - `first_name` (varchar)
      - `last_name` (varchar)
      - `profile_image_url` (varchar)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `plans`
      - `id` (varchar, primary key, auto-generated UUID)
      - `user_id` (varchar, foreign key to users)
      - `title` (varchar)
      - `participants` (jsonb) - Array of participant locations and coordinates
      - `midpoint` (jsonb) - Calculated meeting midpoint coordinates
      - `selected_venues` (jsonb) - Array of selected venue IDs
      - `filters` (jsonb) - Venue search filters
      - `preferences` (jsonb) - User preferences for venue selection
      - `is_public` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `venues`
      - `id` (varchar, primary key, Google Place ID)
      - `name` (varchar)
      - `category` (varchar)
      - `rating` (decimal)
      - `review_count` (integer)
      - `price_level` (integer)
      - `address` (text)
      - `coordinates` (jsonb)
      - `opening_hours` (jsonb)
      - `photos` (jsonb)
      - `website` (varchar)
      - `phone_number` (varchar)
      - `is_open_now` (boolean)
      - `features` (jsonb)
      - `ai_analysis` (jsonb) - AI-generated venue insights
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access to plans (when is_public = true)
    - Add policies for authenticated users to manage their own data
    - Add public read access to venues cache
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email varchar UNIQUE,
  first_name varchar,
  last_name varchar,
  profile_image_url varchar,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id varchar REFERENCES users(id),
  title varchar,
  participants jsonb NOT NULL,
  midpoint jsonb,
  selected_venues jsonb DEFAULT '[]'::jsonb,
  filters jsonb,
  preferences jsonb DEFAULT '{}'::jsonb,
  is_public boolean DEFAULT true,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create venues table
CREATE TABLE IF NOT EXISTS venues (
  id varchar PRIMARY KEY,
  name varchar NOT NULL,
  category varchar,
  rating decimal(3, 2),
  review_count integer,
  price_level integer,
  address text,
  coordinates jsonb NOT NULL,
  opening_hours jsonb,
  photos jsonb,
  website varchar,
  phone_number varchar,
  is_open_now boolean,
  features jsonb,
  ai_analysis jsonb,
  updated_at timestamp DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

-- Plans policies
CREATE POLICY "Public plans are viewable by everyone"
  ON plans FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

CREATE POLICY "Users can view own plans"
  ON plans FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Anyone can create plans"
  ON plans FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own plans"
  ON plans FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own plans"
  ON plans FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Venues policies (public cache)
CREATE POLICY "Venues are viewable by everyone"
  ON venues FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service can manage venues"
  ON venues FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Service can update venues"
  ON venues FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
