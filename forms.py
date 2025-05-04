from flask_wtf import FlaskForm
from wtforms import StringField, SelectField, SubmitField
from wtforms.validators import DataRequired, Length

class JokeForm(FlaskForm):
    """Form for generating jokes."""
    joke_type = SelectField('Joke Type', 
        choices=[
            ('dad joke', 'Dad Joke'),
            ('pun', 'Pun'),
            ('one-liner', 'One-liner'),
            ('knock-knock joke', 'Knock-Knock Joke'),
            ('riddle', 'Riddle'),
            ('silly joke', 'Silly Joke')
        ],
        validators=[DataRequired()]
    )
    
    topic = StringField('Topic', 
        validators=[
            DataRequired(),
            Length(min=2, max=50, message="Topic must be between 2 and 50 characters.")
        ],
        render_kw={"placeholder": "Enter a topic (e.g., pizza, computers, cats)"}
    )
    
    submit = SubmitField('Generate Joke')
