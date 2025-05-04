import os
import logging
from flask import Flask, render_template, flash, redirect, url_for, request, jsonify
from forms import JokeForm
import openai

# Set up logging
log_level = logging.DEBUG if os.environ.get("FLASK_ENV") == "development" else logging.INFO
logging.basicConfig(level=log_level)

# Create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "joke-generator-secret")
app.config["PROPAGATE_EXCEPTIONS"] = True

# Production settings
if os.environ.get("FLASK_ENV") != "development":
    app.config["DEBUG"] = False

# Set up OpenAI
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    logging.warning("No OpenAI API key found in environment variables.")

# Initialize OpenAI client
openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)

@app.route('/', methods=['GET', 'POST'])
def index():
    form = JokeForm()
    joke_result = None
    
    if form.validate_on_submit():
        try:
            joke_result = generate_joke(form.joke_type.data, form.topic.data)
        except Exception as e:
            logging.error(f"Error generating joke: {str(e)}")
            flash("An error occurred while generating your joke. Please try again.", "danger")
    
    return render_template('index.html', form=form, joke_result=joke_result)

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/generate-joke', methods=['POST'])
def generate_joke_api():
    if not request.json:
        return jsonify({"error": "Invalid request, JSON required"}), 400
    
    joke_type = request.json.get('joke_type')
    topic = request.json.get('topic')
    
    if not joke_type or not topic:
        return jsonify({"error": "Joke type and topic are required"}), 400
    
    try:
        joke = generate_joke(joke_type, topic)
        
        # Check if the joke contains an error message
        if joke.startswith("⚠️"):
            return jsonify({"error": joke}), 200
        else:
            return jsonify({"joke": joke})
    except Exception as e:
        logging.error(f"Error generating joke: {str(e)}")
        return jsonify({"error": "Failed to generate joke"}), 500

def generate_joke(joke_type, topic):
    """Generate a joke using OpenAI's API based on the given type and topic."""
    if not OPENAI_API_KEY:
        return "Please set your OpenAI API key to generate jokes."
    
    try:
        # the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
        # do not change this unless explicitly requested by the user
        prompt = f"Create a {joke_type} about {topic}. Make it family-friendly and clever."
        
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a witty, family-friendly joke writer skilled at creating various types of jokes."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=200
        )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        error_msg = str(e)
        logging.error(f"OpenAI API error: {error_msg}")
        
        # Check for quota exceeded errors
        if "insufficient_quota" in error_msg or "exceeded your current quota" in error_msg:
            return "⚠️ OpenAI API quota exceeded. The API key doesn't have enough credits to generate jokes. Please check your OpenAI account billing details."
        elif "rate limit" in error_msg.lower():
            return "⚠️ Rate limit reached. Please try again in a few moments."
        else:
            return f"⚠️ Sorry, there was an error generating your joke. Please try again later."

if __name__ == '__main__':
    # Use environment variables to configure the server when available
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_ENV") == "development"
    app.run(host='0.0.0.0', port=port, debug=debug)
